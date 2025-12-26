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
}

/**
 * 将 Figma 节点类型映射到 HTML 标签
 */
function getHTMLTag(nodeType: string): string {
  const tagMap: Record<string, string> = {
    FRAME: "div",
    GROUP: "div",
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
 * 递归转换 Figma 节点为 HTML 节点
 */
async function convertNodeToHTML(
  node: SceneNode,
  includeStyles: boolean = true
): Promise<HTMLNode> {
  const tag = getHTMLTag(node.type);
  const attributes = getNodeAttributes(node);
  const text = getTextContent(node);

  let styles: Record<string, string> = {};

  // 获取 CSS 样式
  if (includeStyles && "getCSSAsync" in node) {
    try {
      const css = await (node as any).getCSSAsync();
      styles = replaceVar(css || {});
    } catch (error) {
      console.warn(`无法获取节点 ${node.name} 的 CSS:`, error);
    }
  }

  // 处理子节点
  const children: HTMLNode[] = [];
  if ("children" in node && node.children) {
    for (const child of node.children) {
      const childHTML = await convertNodeToHTML(child, includeStyles);
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

function replaceVar(css: any) {
  try {
    console.log(css);
    const collections = figma.variables.getLocalVariableCollections();

    for (const collection of collections) {
      console.log("Collection:", collection.name);

      for (const variableId of collection.variableIds) {
        const variable = figma.variables.getVariableById(variableId);

        console.log({
          name: variable?.name, // --color/primary
          type: variable?.resolvedType, // COLOR | FLOAT | STRING
          values: variable?.valuesByMode, // 各 mode 的值
        });
      }
    }
    return css;
  } catch (e) {
    return css;
  }
}
