/**
 * MasterGo 节点转 HTML AST 转换器
 * 将 MasterGo 选中的节点及其所有子节点转换为 HTML 结构
 */

interface HTMLNode {
  tag: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  children: HTMLNode[];
  text?: string;
  svg?: string;
  hidden?: boolean;
}

/**
 * 将 MasterGo 节点类型映射到 HTML 标签
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
    PEN: "SVG",
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
  // attrs['data-mg-type'] = _node.type;
  // attrs['data-mg-id'] = _node.id;

  return attrs;
}

function convertSegmentStylesToCSS(segment: any): Record<string, string> {
  const styles: Record<string, string> = {};
  const textStyle = segment.textStyle || {};

  // 字体大小
  if (textStyle.fontSize !== undefined) {
    styles.fontSize = `${textStyle.fontSize}px`;
  }

  // 字体族
  if (textStyle.fontName) {
    styles.fontFamily = textStyle.fontName.family;
    styles.fontWeight = textStyle.fontName.style.toLowerCase().includes("bold")
      ? "700"
      : "400";
    if (textStyle.fontName.style.toLowerCase().includes("italic")) {
      styles.fontStyle = "italic";
    }
  }

  // 字重（如果单独指定）
  if (textStyle.fontWeight !== undefined && textStyle.fontWeight !== 400) {
    styles.fontWeight = String(textStyle.fontWeight);
  }

  // 文本装饰
  if (textStyle.textDecoration) {
    if (textStyle.textDecoration === "UNDERLINE") {
      styles.textDecoration = "underline";
    } else if (textStyle.textDecoration === "STRIKETHROUGH") {
      styles.textDecoration = "line-through";
    } else if (textStyle.textDecoration === "NONE") {
      styles.textDecoration = "none";
    }
  }

  // 文本转换
  if (textStyle.textCase) {
    if (textStyle.textCase === "UPPER") {
      styles.textTransform = "uppercase";
    } else if (textStyle.textCase === "LOWER") {
      styles.textTransform = "lowercase";
    } else if (textStyle.textCase === "TITLE") {
      styles.textTransform = "capitalize";
    }
  }

  // 行高
  if (textStyle.lineHeight) {
    if (textStyle.lineHeight.unit === "PIXELS") {
      styles.lineHeight = `${textStyle.lineHeight.value}px`;
    } else if (textStyle.lineHeight.unit === "PERCENT") {
      styles.lineHeight = `${textStyle.lineHeight.value}%`;
    }
  }

  // 字间距
  if (textStyle.letterSpacing) {
    if (textStyle.letterSpacing.unit === "PIXELS") {
      styles.letterSpacing = `${textStyle.letterSpacing.value}px`;
    } else if (textStyle.letterSpacing.unit === "PERCENT") {
      styles.letterSpacing = `${textStyle.letterSpacing.value / 100}em`;
    }
  }

  // 填充颜色
  if (segment.fills && segment.fills.length > 0) {
    const fill = segment.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      const { r, g, b, a } = fill.color;
      styles.color = `rgba(${Math.round(r * 255)}, ${Math.round(
        g * 255
      )}, ${Math.round(b * 255)}, ${a})`;
    }
  }

  return styles;
}

/**
 * 递归转换 MasterGo 节点为 HTML 节点
 */
async function convertNodeToHTML(node: SceneNode): Promise<HTMLNode> {
  const tag = getHTMLTag(node.type);
  const attributes = getNodeAttributes(node);
  const text = getTextContent(node);

  let styles: Record<string, string> = {};

  const css = getCSS(node);
  Object.assign(styles, css);

  if (!node.isVisible) {
    return {
      tag,
      attributes,
      styles,
      children: [],
      hidden: true,
    };
  }

  // 处理子节点
  const children: HTMLNode[] = [];

  if (node.type === "TEXT") {
    if (node.textStyles?.length > 1) {
      for (const segment of node.textStyles) {
        // 直接从 segment 对象中提取样式并转换为 CSS
        const segmentStyles = convertSegmentStylesToCSS(segment);

        children.push({
          tag: "span",
          attributes: {},
          styles: segmentStyles,
          children: [],
          text: text?.substring(segment.start, segment.end) || "",
        });
      }

      if (styles) {
        delete styles['width'];
        delete styles['height'];
        delete styles["text-decoration-line"];
        delete styles["text-transform"];
        delete styles["letter-spacing"];
        delete styles["line-height"];
        delete styles["font-size"];
        delete styles["font-family"];
        delete styles["font-weight"];
        delete styles["font-style"];
        delete styles["color"];
        delete styles["opacity"];
        delete styles["fill-style-id"];
        delete styles["list-options"];
        delete styles["indentation"];
        delete styles["hyperlink"];
        delete styles["text-case"];
        delete styles["text-decoration"];
      }

      // 如果成功处理了文本段落，清空父节点的 text
      return {
        tag,
        attributes,
        styles,
        children,
        text: undefined,
      };
    } else if (node.textStyles?.length === 1) {
      const segmentStyles = convertSegmentStylesToCSS(node.textStyles[0]);
      Object.assign(styles, segmentStyles);
    }
  }

  if ("exportAsync" in node) {
    // 特殊处理：如果是 SVG 节点，获取实际的 SVG 内容
    if (
      "children" in node &&
      node.children &&
      // @ts-expect-error strokes
      node.children[0]?.strokes?.length
    ) {
      try {
        const svgString = await (node as any).exportAsync({
          format: "SVG",
        });

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
  }

  // 处理普通子节点
  if ("children" in node && node.children) {
    for (const child of node.children) {
      const childHTML = await convertNodeToHTML(child);
      children.push(childHTML);
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
    return "";
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
 * 主函数：将选中的 MasterGo 节点转换为 HTML
 * @param node - MasterGo 节点
 * @param options - 选项
 * @returns HTML 字符串和 DOM 元素
 */
export async function mgNodeToHTML(
  node: SceneNode,
  options: {
    format?: "string" | "dom" | "both";
  }
): Promise<{
  html: string;
  element?: HTMLElement;
  ast: HTMLNode;
}> {
  const { format = "both" } = options;

  // 转换为 HTML AST
  const ast = await convertNodeToHTML(node);

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

export const map: Record<string, string> = {};

function getCSS(node: any): Record<string, string> {
  const css: Record<string, string> = {};

  const ins = window.hhw.mgCtrl.getModule("abe2")?.["b"];
  const emit = ins.emit.bind(ins);
  const ins2 = window.hhw.mgCtrl.getModule("fcaa")?.["b"];
  const getLayerData = ins2.getLayerData.bind(ins2);

  const nodeData = getLayerData(node.id);
  for (const key in nodeData) {
    if (nodeData[key] === null) {
      nodeData[key] = undefined;
    }
  }

  if (!nodeData.bound) {
    nodeData.bound = {
      height: nodeData.height,
      width: nodeData.width
    };
  }


  const info = emit(nodeData, {
    componentSetDescription: "",
    description: "",
    documentId: window.mg.documentId,
    font: null,
    style: window.hhw.mgCtrl.getModule("f391").c(),
  });

  const styleStr = `
  ${info.other}
  ${info.typography}
  `;

  console.log(styleStr);

  // 将 CSS 字符串转换为样式对象，并去掉定位相关的属性
  const positionProps = ["position", "left", "top", "right", "bottom"];

  if (styleStr && typeof styleStr === "string") {
    // 按行分割 CSS
    const lines = styleStr.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 跳过注释和空行
      if (
        !trimmedLine ||
        trimmedLine.startsWith("/*") ||
        trimmedLine.endsWith("*/") ||
        trimmedLine === "*/"
      ) {
        continue;
      }

      // 解析 CSS 属性：property: value;
      const colonIndex = trimmedLine.indexOf(":");
      if (colonIndex > 0) {
        const property = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();

        // 移除末尾的分号
        if (value.endsWith(";")) {
          value = value.slice(0, -1).trim();
        }

        // 跳过定位相关的属性
        if (positionProps.includes(property)) {
          continue;
        }

        // 转换 CSS 属性名为 camelCase (kebab-case -> camelCase)
        const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );

        if (value === 'undefined') {
          // 不处理
        } else if (['width', 'height'].includes(camelCaseProperty)) {
          css[camelCaseProperty] = nodeData[camelCaseProperty] + 'px';

        } else if (camelCaseProperty === 'opacity' && value === '1') {

        } else if (camelCaseProperty === 'padding') {
          if (nodeData.padding) {
            let padding = '';
            for (const p of nodeData.padding) {
              if (p != null) {
                padding += `${p}px `
              }
             
            }
            css.padding = padding;
          }
        } else {
          css[camelCaseProperty] = value;
        }
      }
    }
  }

  console.log("Parsed CSS:", css);

  return css;
}
