/**
 * Figma 节点转 HTML AST 转换器
 * 将 Figma 选中的节点及其所有子节点转换为 HTML 结构
 */

interface HTMLNode {
  tag: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  children: HTMLNode[];
  text?: string;
  svg?: string;
  hidden?: boolean
}

/**
 * 将 Figma 节点类型映射到 HTML 标签
 */
function getHTMLTag(nodeType: string): string {
  const tagMap: Record<string, string> = {
    FRAME: "div",
    GROUP: "svg",
    TEXT: "span",
    RECTANGLE: "div",
    ELLIPSE: "div",
    POLYGON: "div",
    STAR: "div",
    VECTOR: "svg",
    BOOLEAN_OPERATION: "div",
    COMPONENT: "div",
    INSTANCE: "div",
    SLICE: "div",
    LINE: "div",
  };
  return tagMap[nodeType] || "div";
}

/**
 * 将样式对象转换为 CSS 字符串
 */
function stylesToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .filter(([key]) => key !== "fontFamily" && key !== "font-family") // 过滤掉 font-family 属性
    .map(([key, value]) => {
      // 将 camelCase 转换为 kebab-case
      const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      // 转义双引号，防止 HTML 属性提前闭合
      const escapedValue = value.replace(/"/g, "&quot;");
      return `${kebabKey}: ${escapedValue}`;
    })
    .join("; ");
}

/**
 * 处理文本节点
 */
function getTextContent(node: SceneNode): string | undefined {
  if (node.type === "TEXT" && "characters" in node) {
    return node.characters;
  }
  return undefined;
}

/**
 * 获取节点的属性（id, class 等）
 * 注意：不生成 class 属性，样式通过内联 style 方式设置
 */
function getNodeAttributes(_node: SceneNode): Record<string, string> {
  const attrs: Record<string, string> = {};

  // 不生成 class 属性，所有样式都通过内联 CSS（style 属性）的方式设置
  // 样式通过 convertNodeToHTML 中的 getCSSAsync() 获取并内联到 style 属性中

  // // 添加 data 属性（可选）
  // attrs['data-figma-type'] = _node.type;
  // attrs['data-figma-id'] = _node.id;

  return attrs;
}

/**
 * 将 Figma 文本段落样式转换为 CSS 样式对象
 */
function convertSegmentStylesToCSS(segment: any): Record<string, string> {
  const styles: Record<string, string> = {};

  // 字体大小
  if (segment.fontSize !== undefined) {
    styles.fontSize = `${segment.fontSize}px`;
  }

  // 字体族
  if (segment.fontName) {
    styles.fontFamily = segment.fontName.family;
    styles.fontWeight = segment.fontName.style.toLowerCase().includes("bold")
      ? "700"
      : "400";
    if (segment.fontName.style.toLowerCase().includes("italic")) {
      styles.fontStyle = "italic";
    }
  }

  // 字重（如果单独指定）
  if (segment.fontWeight !== undefined && segment.fontWeight !== 400) {
    styles.fontWeight = String(segment.fontWeight);
  }

  // 文本装饰
  if (segment.textDecoration) {
    if (segment.textDecoration === "UNDERLINE") {
      styles.textDecoration = "underline";
    } else if (segment.textDecoration === "STRIKETHROUGH") {
      styles.textDecoration = "line-through";
    } else if (segment.textDecoration === "NONE") {
      styles.textDecoration = "none";
    }
  }

  // 文本转换
  if (segment.textCase) {
    if (segment.textCase === "UPPER") {
      styles.textTransform = "uppercase";
    } else if (segment.textCase === "LOWER") {
      styles.textTransform = "lowercase";
    } else if (segment.textCase === "TITLE") {
      styles.textTransform = "capitalize";
    }
  }

  // 行高
  if (segment.lineHeight) {
    if (segment.lineHeight.unit === "PIXELS") {
      styles.lineHeight = `${segment.lineHeight.value}px`;
    } else if (segment.lineHeight.unit === "PERCENT") {
      styles.lineHeight = `${segment.lineHeight.value}%`;
    }
  }

  // 字间距
  if (segment.letterSpacing) {
    if (segment.letterSpacing.unit === "PIXELS") {
      styles.letterSpacing = `${segment.letterSpacing.value}px`;
    } else if (segment.letterSpacing.unit === "PERCENT") {
      styles.letterSpacing = `${segment.letterSpacing.value / 100}em`;
    }
  }

  // 填充颜色
  if (segment.fills && segment.fills.length > 0) {
    const fill = segment.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      const { r, g, b } = fill.color;
      const a = fill.opacity !== undefined ? fill.opacity : 1;
      styles.color = `rgba(${Math.round(r * 255)}, ${Math.round(
        g * 255
      )}, ${Math.round(b * 255)}, ${a})`;
    }
  }

  return styles;
}

/**
 * 递归转换 Figma 节点为 HTML 节点
 */
async function convertNodeToHTML(
  node: SceneNode,
  includeStyles: boolean = true,
): Promise<HTMLNode> {
  const tag = getHTMLTag(node.type);
  const attributes = getNodeAttributes(node);
  const text = getTextContent(node);

  let styles: Record<string, string> = {};

  // 获取 CSS 样式
  if (includeStyles && "getCSSAsync" in node) {
    try {
      const css = await (node as any).getCSSAsync();
      styles = replaceVar(
        css || {},
        node.boundVariables || {},
        node.resolvedVariableModes || {}
      );
    } catch (error) {
      console.warn(`无法获取节点 ${node.name} 的 CSS:`, error);
    }
  }

  // 特殊处理：如果是 SVG 节点，获取实际的 SVG 内容
  if (tag === "svg" && "exportAsync" in node) {
    try {
      const svgBytes = await (node as any).exportAsync({
        format: "SVG",
        svgOutlineText: false,
      });
      const svgString = new TextDecoder().decode(svgBytes);

      // 可以选择将 SVG 内容存储在 attributes 或其他地方
      // 这里暂时记录到控制台，根据需求可以进一步处理
      return {
        tag,
        attributes,
        styles,
        children: [],
        text: undefined,
        svg: svgString,
      };
    } catch (error) {
      console.warn(`无法导出 SVG 节点 ${node.name}:`, error);
    }
  }

  // 处理子节点
  const children: HTMLNode[] = [];

  // 如果是文本节点且包含多种样式，使用 getStyledTextSegments 处理
  if (
    node.type === "TEXT" &&
    "getStyledTextSegments" in node &&
    includeStyles
  ) {
    try {
      const segments = await (node as any).getStyledTextSegments([
        "fontSize",
        "fontName",
        "fontWeight",
        "textDecoration",
        "textCase",
        "lineHeight",
        "letterSpacing",
        "fills",
        "fillStyleId",
        "listOptions",
        "indentation",
        "hyperlink",
      ]);

      // 如果有多个样式段落，将每个段落作为子节点
      if (segments && segments.length > 1) {
        for (const segment of segments) {
          // 直接从 segment 对象中提取样式并转换为 CSS
          const segmentStyles = convertSegmentStylesToCSS(segment);

          children.push({
            tag: "span",
            attributes: {},
            styles: segmentStyles,
            children: [],
            text: segment.characters,
          });
        }

        if (styles) {
          delete styles['text-decoration-line'];
          delete styles['text-transform'];
          delete styles['letter-spacing'];
          delete styles['line-height'];
          delete styles['font-size'];
          delete styles['font-family'];
          delete styles['font-weight'];
          delete styles['font-style'];
          delete styles['color'];
          delete styles['opacity'];
          delete styles['fill-style-id'];
          delete styles['list-options'];
          delete styles['indentation'];
          delete styles['hyperlink'];
          delete styles['text-case'];
          delete styles['text-decoration'];
        }

        // 如果成功处理了文本段落，清空父节点的 text
        return {
          tag,
          attributes,
          styles,
          children,
          text: undefined,
        };
      } else if (segments && segments.length === 1) {
        Object.assign(styles, convertSegmentStylesToCSS(segments[0]));
      }
    } catch (error) {
      console.warn(`无法获取文本段落:`, error);
      // 如果失败，继续使用原有逻辑
    }
  }

  // 处理普通子节点
  if ("children" in node && node.children) {
    for (const child of node.children) {
      const childHTML = await convertNodeToHTML(child, includeStyles);
      children.push(childHTML);
    }
  }

  // 检查：如果是 div 且所有子节点都是 svg，则将整个节点导出为 svg
  if (tag === "div" && children.length > 1 && "exportAsync" in node) {
    const svg_times = children.filter((child) => child.tag === "svg").length;
    const other_times = children.filter((child) => child.tag !== "svg").length;
    const allChildrenAreSvg = svg_times > 1 && svg_times > other_times;

    if (allChildrenAreSvg) {

      try {
        const svgBytes = await (node as any).exportAsync({
          format: "SVG",
          svgOutlineText: false,
        });
        const svgString = new TextDecoder().decode(svgBytes);

        return {
          tag: "svg",
          attributes,
          styles,
          children: [],
          text: undefined,
          svg: svgString,
        };
      } catch (error) {
        console.warn(`无法导出 div->svg 节点 ${node.name}:`, error);
      }
    }
  }

  return {
    tag,
    attributes,
    styles,
    children,
    text,
  };
}

/**
 * 将 HTML 节点对象转换为 HTML 字符串
 */
function htmlNodeToString(node: HTMLNode, indent: number = 0): string {
  const indentStr = "  ".repeat(indent);
  if (node.hidden) {
    return '';
  }
  if (node.svg) {
    return node.svg
      .split("\n")
      .map((line) => `${indentStr}${line}`)
      .join("\n");
  }
  const attrsStr = Object.entries(node.attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

  const styleStr =
    Object.keys(node.styles).length > 0
      ? ` style="${stylesToString(node.styles)}"`
      : "";

  const openTag = `<${node.tag}${attrsStr ? " " + attrsStr : ""}${styleStr}>`;

  // 如果有文本内容且没有子节点，使用文本内容
  if (node.text !== undefined && node.children.length === 0) {
    return `${indentStr}${openTag}${node.text}</${node.tag}>`;
  }

  // 如果有子节点
  if (node.children.length > 0) {
    const childrenHTML = node.children
      .map((child) => htmlNodeToString(child, indent + 1))
      .join("\n");

    // 如果有文本内容，也包含进去
    const content = node.text
      ? `\n${indentStr}  ${node.text}\n${childrenHTML}`
      : `\n${childrenHTML}\n${indentStr}`;

    return `${indentStr}${openTag}${content}</${node.tag}>`;
  }

  // 自闭合标签或空标签
  return `${indentStr}${openTag}</${node.tag}>`;
}

/**
 * 将 HTML 节点对象转换为 DOM 元素
 */
function htmlNodeToDOM(node: HTMLNode): HTMLElement | Text {
  // 如果是文本节点
  if (
    node.text !== undefined &&
    node.children.length === 0 &&
    node.tag === "span"
  ) {
    const textNode = document.createTextNode(node.text);
    const span = document.createElement("span");
    Object.entries(node.attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
    Object.entries(node.styles).forEach(([key, value]) => {
      (span.style as any)[key] = value;
    });
    span.appendChild(textNode);
    return span;
  }

  const element = document.createElement(node.tag);

  // 设置属性
  Object.entries(node.attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  // 设置样式
  Object.entries(node.styles).forEach(([key, value]) => {
    (element.style as any)[key] = value;
  });

  // 添加文本内容
  if (node.text !== undefined) {
    element.appendChild(document.createTextNode(node.text));
  }

  // 递归添加子节点
  node.children.forEach((child) => {
    const childElement = htmlNodeToDOM(child);
    element.appendChild(childElement);
  });

  return element;
}

/**
 * 主函数：将选中的 Figma 节点转换为 HTML
 * @param node - Figma 节点
 * @param options - 选项
 * @returns HTML 字符串和 DOM 元素
 */
export async function figmaNodeToHTML(
  node: SceneNode,
  options: {
    includeStyles?: boolean;
    format?: "string" | "dom" | "both";
  } = {}
): Promise<{
  html: string;
  element?: HTMLElement;
  ast: HTMLNode;
}> {
  const { includeStyles = true, format = "both" } = options;

  // 转换为 HTML AST
  const ast = await convertNodeToHTML(node, includeStyles);

  // 生成 HTML 字符串
  const html = htmlNodeToString(ast);

  // 如果需要 DOM 元素
  let element: HTMLElement | undefined;
  if (format === "dom" || format === "both") {
    const domElement = htmlNodeToDOM(ast);
    if (domElement instanceof HTMLElement) {
      element = domElement;
    } else {
      // 如果根节点是文本，包装在 div 中
      const wrapper = document.createElement("div");
      wrapper.appendChild(domElement);
      element = wrapper;
    }
  }

  return {
    html,
    element,
    ast,
  };
}

/**
 * 便捷函数：获取当前选中节点并转换为 HTML
 */
export async function getSelectedNodeHTML(
  figma: PluginAPI,
  options?: {
    includeStyles?: boolean;
    format?: "string" | "dom" | "both";
  }
): Promise<{
  html: string;
  element?: HTMLElement;
  ast: HTMLNode;
} | null> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    return null;
  }

  // 处理第一个选中的节点
  const node = selection[0];
  return await figmaNodeToHTML(node, options);
}

/**
 * 便捷函数：获取所有选中节点并转换为 HTML
 */
export async function getAllSelectedNodesHTML(
  figma: PluginAPI,
  options?: {
    includeStyles?: boolean;
    format?: "string" | "dom" | "both";
  }
): Promise<
  Array<{
    html: string;
    element?: HTMLElement;
    ast: HTMLNode;
  }>
> {
  const selection = figma.currentPage.selection;

  const results = await Promise.all(
    selection.map((node) => figmaNodeToHTML(node, options))
  );

  return results;
}

export const map: Record<string, string> = {};

function replaceVar(css: any, boundVariables: any, resolvedVariableModes: any) {
  try {
    const deal = (variable: any, key?: string) => {
      try {
        if (variable.codeSyntax?.WEB && variable.variableCollectionId) {
          if (map[variable.codeSyntax.WEB]) {
            return;
          }

          const variableCollectionId = variable.variableCollectionId;
          const curModeId = resolvedVariableModes[variableCollectionId];
          const value = variable.valuesByMode[curModeId];
          if (typeof value === "string") {
            map[variable.codeSyntax.WEB] = value;
            if (key) {
              map[key] = value;
            }
          } else if (typeof value === "number") {
            map[variable.codeSyntax.WEB] = value + "px";
            if (key) {
              map[key] = map[variable.codeSyntax.WEB];
            }
          } else if (typeof value === "object") {
            if (value.id) {
              const variable = window.figma.variables.getVariableById(value.id);
              deal(variable, key || variable.codeSyntax.WEB);
            } else if (value.r && value.g && value.b) {
              const { r, g, b } = value;
              const a = value.a !== undefined ? value.a : 1;
              map[variable.codeSyntax.WEB] = `rgba(${Math.round(
                r * 255
              )}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
              if (key) {
                map[key] = map[variable.codeSyntax.WEB];
              }
            } else if (value.type === "GRADIENT") {
              const { stops } = value;
              const gradient = `linear-gradient(${stops
                .map(
                  (stop: any) =>
                    `${stop.color.r}, ${stop.color.g}, ${stop.color.b}, ${stop.color.a}`
                )
                .join(", ")})`;
              map[variable.codeSyntax.WEB] = gradient;
              if (key) {
                map[key] = map[variable.codeSyntax.WEB];
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    for (const key in boundVariables) {
      try {
        if (Array.isArray(boundVariables[key])) {
          for (const item of boundVariables[key]) {
            if (item.id) {
              const variable = window.figma.variables.getVariableById(item.id);
              deal(variable);
            }
          }
        } else if (boundVariables[key]?.id) {
          const variable = window.figma.variables.getVariableById(
            boundVariables[key].id
          );
          deal(variable);
        }
      } catch (e) {
        console.error(e);
      }
    }

    for (const key in css) {
      let varValue = css[key];
      if (varValue.includes("var(")) {
        if (map[css[key]]) {
          css[key] = map[css[key]];
        }
      }
      varValue = css[key];
      if (varValue.includes("var(")) {

        const arr = css[key].split(" ");
        const newArr = arr.map((item: string) => {
          if (item.includes("var(")) {
            if (map[item]) {
              return map[item];
            }
            const varValue = item.replace(/var\(\s*[^,]+,\s*([^)]+)\s*\)/g, "$1");
            return varValue || item;
          }
          return item;
        });
        css[key] = newArr.join(" ").replace(/var\(\s*[^,]+,\s*([^)]+)\s*\)/g, "$1");
      }
    }

    return css;
  } catch (e) {
    return css;
  }
}