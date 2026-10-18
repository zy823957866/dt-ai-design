/** 多智能体区域骨架与合并（纯文档操作）。 */

import {
  generateId,
  type DesignDocument,
  type FrameLayer,
  type Layer,
} from '@dt-ai-design/design-schema';

import type { CanvasGenerationPlan } from './stages';

export interface RegionScaffoldResult {
  document: DesignDocument;
  pageId: string;
  regionIds: string[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isFrame = (layer: Layer | undefined): layer is FrameLayer =>
  Boolean(layer && layer.type === 'frame');

const collectSubtree = (
  document: DesignDocument,
  rootId: string,
  ids = new Set<string>(),
): Set<string> => {
  const layer = document.layers[rootId];
  if (!layer) return ids;
  ids.add(rootId);
  if (layer.type === 'frame' || layer.type === 'group') {
    for (const child of layer.children) collectSubtree(document, child, ids);
  }
  return ids;
};

const findRootPage = (document: DesignDocument): string | undefined =>
  document.rootLayerIds.find((id) => isFrame(document.layers[id]));

/**
 * 在文档中放置区域骨架 frame（每个区域一个 frame，坐标取自规划 bounds）。
 * 已存在的区域 frame 会被就地更新，不会重复创建。
 */
export const placeRegionScaffolds = ({
  document,
  plan,
  pageWidth = 1440,
}: {
  document: DesignDocument;
  plan: CanvasGenerationPlan;
  pageWidth?: number;
}): RegionScaffoldResult => {
  const next = clone(document);

  let pageId = findRootPage(next);
  if (!pageId) {
    const page: FrameLayer = {
      id: generateId('layer'),
      name: 'Page',
      type: 'frame',
      x: 0,
      y: 0,
      width: pageWidth,
      height: 600,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      parentId: null,
      index: next.rootLayerIds.length,
      blendMode: 'normal',
      layerPosition: 'auto',
      children: [],
      layout: {
        mode: 'none',
        gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        justifyContent: 'start',
        alignItems: 'start',
      },
      sizingMode: { width: 'fixed', height: 'fixed' },
      fills: [{ type: 'solid', color: '#FFFFFF', opacity: 1 }],
      strokes: [],
      cornerRadius: 0,
      effects: [],
      overflow: 'visible',
      clipContent: false,
    };
    next.layers[page.id] = page;
    next.rootLayerIds.push(page.id);
    pageId = page.id;
  }

  const page = next.layers[pageId] as FrameLayer;
  const regionIds: string[] = [];

  for (const region of [...plan.regions].sort((a, b) => a.order - b.order)) {
    const bounds = region.bounds ?? {
      x: 0,
      y: region.order * 600,
      width: pageWidth,
      height: 600,
    };
    const existing = next.layers[region.regionId];
    if (isFrame(existing)) {
      existing.name = region.label;
      existing.x = bounds.x;
      existing.y = bounds.y;
      existing.width = bounds.width;
      existing.height = bounds.height;
      existing.parentId = pageId;
    } else {
      const regionFrame: FrameLayer = {
        id: region.regionId,
        name: region.label,
        type: 'frame',
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        parentId: pageId,
        index: page.children.length,
        blendMode: 'normal',
        layerPosition: 'auto',
        children: [],
        layout: {
          mode: 'vertical',
          gap: 16,
          padding: { top: 24, right: 24, bottom: 24, left: 24 },
          justifyContent: 'start',
          alignItems: 'start',
        },
        sizingMode: { width: 'fixed', height: 'fixed' },
        fills: [],
        strokes: [],
        cornerRadius: 0,
        effects: [],
        overflow: 'visible',
        clipContent: true,
      };
      next.layers[regionFrame.id] = regionFrame;
      page.children.push(regionFrame.id);
    }
    regionIds.push(region.regionId);

    const maxBottom = bounds.y + bounds.height;
    if (page.height < maxBottom) page.height = maxBottom;
  }

  page.children.forEach((id, index) => {
    const layer = next.layers[id];
    if (layer) layer.index = index;
  });

  return { document: next, pageId, regionIds };
};

/**
 * 把一个 worker 文档中的区域子树合并回主文档（替换同 id 的区域 frame 子树）。
 * 区域在任一侧缺失时原样返回主文档。
 */
export const mergeRegionDocument = ({
  document,
  workerDocument,
  regionId,
}: {
  document: DesignDocument;
  workerDocument: DesignDocument;
  regionId: string;
}): DesignDocument => {
  const next = clone(document);
  const workerRegion = workerDocument.layers[regionId];
  const mainRegion = next.layers[regionId];
  if (!workerRegion || !mainRegion) return next;

  const oldIds = collectSubtree(next, regionId);
  const newIds = collectSubtree(workerDocument, regionId);

  for (const id of oldIds) {
    if (id !== regionId && !workerDocument.layers[id]) {
      delete next.layers[id];
    }
  }
  for (const id of newIds) {
    next.layers[id] = clone(workerDocument.layers[id]);
  }
  next.layers[regionId].parentId = mainRegion.parentId;
  next.layers[regionId].index = mainRegion.index;

  return next;
};
