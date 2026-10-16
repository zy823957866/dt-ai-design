import type { DesignDocument } from '@dt-ai-design/design-schema';

/**
 * 文档生成 prompt 模板。
 *
 * 格式说明与 design-schema 的 Zod 校验严格对齐：
 * 缺字段会校验失败，多余字段会被 strip（无害）。
 */

const DOC_SPEC = `## 设计文档 JSON 结构

只输出一个 JSON 对象（可包裹在 \`\`\`json 代码块中），不要输出任何解释文字，不要执行命令或读写文件。

顶层结构：
{
  "layers": { "<图层id>": { ...图层对象... } },
  "rootLayerIds": ["<顶层图层id>"],
  "components": {},
  "variables": {}
}

所有图层扁平存储在 layers 中，父子关系通过 frame/group 的 children: string[] 引用。

图层通用字段（每个图层必填）：
id, name, type, x, y, width, height, rotation(0), opacity(0~1), visible(true), locked(false), parentId(顶层为 null), index(同级排序，从 0 起), blendMode("normal"), layerPosition("auto")
（metadata 字段可选，不需要输出。）

各类型特有字段：
- "frame": children: string[], layout: { "mode": "none"|"vertical"|"horizontal", "gap": number, "padding": {"top":number,"right":number,"bottom":number,"left":number}, "justifyContent": "start"|"center"|"end"|"spaceBetween"|"spaceAround", "alignItems": "start"|"center"|"end" }, fills, strokes, cornerRadius, effects, overflow("visible"|"hidden"), clipContent(true)
- "rectangle": fills, strokes, cornerRadius, effects
- "ellipse": fills, strokes, effects, arcStartAngle(0), arcEndAngle(360), innerRadius(0)
- "text": content, fontFamily("Inter"), fontWeight(400~700), fontSize, lineHeight, letterSpacing(0), textAlign("left"|"center"|"right"), textDecoration("none"), fills, strokes([]), sizing("autoHeight"), overflow("visible")
- "group": children: string[], effects([])

fills 数组元素：{ "type": "solid", "color": "#RRGGBB", "opacity": 1 }
strokes 数组元素：{ "color": "#RRGGBB", "width": 1, "style": "solid", "position": "inside", "opacity": 1 }
effects 为数组，通常为 []。

## 设计准则
- 最外层放一个 frame 画板（桌面网页 1440x900 或移动端 375x812），全部内容放在画板内，子图层坐标相对于画板左上角。
- 保持专业视觉品质：间距有节奏、字号分级（如 12/14/16/24/32）、色彩分层（背景 / 表面 / 主文本 / 次文本 / 强调色）。
- 图层 id 用语义化英文（如 "hero-title"），name 用简短描述。
- children 中出现的 id 必须存在于 layers；引用的 id 不能缺失，否则校验失败。`;

export interface BuildDocumentPromptInput {
  /** 用户自然语言需求。 */
  prompt: string;
  /** 当前画布文档（作为上下文）。 */
  document: DesignDocument;
  /** 上一轮校验失败时的错误诊断（修复模式）。 */
  repairErrors?: string[];
}

export const buildDocumentPrompt = ({
  prompt,
  document,
  repairErrors,
}: BuildDocumentPromptInput): string => {
  const parts: string[] = [
    '你是内置在设计工具中的 UI 设计生成引擎，请根据需求输出完整的设计文档 JSON。',
    DOC_SPEC,
  ];

  const layerCount = Object.keys(document.layers ?? {}).length;
  parts.push(
    layerCount > 0
      ? `## 当前画布文档（参考，可在此基础上重绘）\n${JSON.stringify(document)}`
      : '## 当前画布\n空白画布，请从零生成。',
  );

  parts.push(`## 用户需求\n${prompt}`);

  if (repairErrors?.length) {
    parts.push(
      `## 上一次输出未通过校验，请修复以下错误后重新输出完整 JSON（不要只输出差异）：\n${repairErrors
        .slice(0, 20)
        .map((e, i) => `${i + 1}. ${e}`)
        .join('\n')}`,
    );
  }

  return parts.join('\n\n');
};

/**
 * 把 codex 生成的 JSON 合成为完整 DesignDocument：
 * 保留项目身份字段（id/name/version/meta.createdAt），补齐可选集合字段。
 */
export const assembleDocument = (
  base: DesignDocument,
  generated: unknown,
): DesignDocument => {
  if (!generated || typeof generated !== 'object' || Array.isArray(generated)) {
    throw new Error('codex 未返回 JSON 对象。');
  }
  const g = generated as Partial<DesignDocument>;
  if (!g.layers || !g.rootLayerIds) {
    throw new Error('codex 输出缺少 layers / rootLayerIds 字段。');
  }

  return {
    ...(g as DesignDocument),
    id: base.id,
    name: base.name,
    version: base.version,
    layers: g.layers,
    rootLayerIds: g.rootLayerIds,
    components: g.components ?? {},
    variables: g.variables ?? {},
    meta: {
      createdAt: base.meta?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    },
  };
};
