import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorProvider } from '@/components/editor/EditorProvider';
import { EditorInteractionProvider } from '@/components/editor/EditorInteractionProvider';
import { TitleBar } from '@/components/editor/TitleBar';
import { LeftPanel } from '@/components/editor/LeftPanel';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { StatusBar } from '@/components/editor/StatusBar';
import { EditorCanvasStage } from '@/components/editor/EditorCanvasStage';
import {
  OverlayHost,
  type OverlayName,
} from '@/components/overlays/OverlayHost';
import { useEditor } from '@/lib/editor';
import { createDocument } from '@dt-ai-design/design-schema';
import type { DesignDocument } from '@dt-ai-design/design-schema';
import type { ProjectWithDocument } from '@/shared/ipc-types';

export default function EditorPage() {
  const { fileId = 'new' } = useParams<{ fileId: string }>();
  const [project, setProject] = useState<ProjectWithDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [overlay, setOverlay] = useState<OverlayName | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const data = await window.desktopAPI.openProject(fileId);
        if (!cancelled && data) setProject(data);
      } catch (err) {
        console.error('Failed to load project:', err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-canvas text-text-tertiary">
        <div className="text-sm">Loading…</div>
      </div>
    );
  }

  const initialDoc = project?.document || createSampleDocument();
  const documentName = project?.name || 'dashboard-ui.pen';

  return (
    <EditorProvider initialDocument={initialDoc} projectId={project?.id}>
      <EditorInteractionProvider>
        <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-canvas text-text-primary">
          <EditorTitleBar
            projectName={documentName}
            onBack={() => navigate('/dashboard')}
            onExport={() => setOverlay('export')}
            onOpenSettings={() => setOverlay('settings')}
          />

          <div className="flex flex-1 overflow-hidden">
            <LeftPanel
              collapsed={leftCollapsed}
              onCollapse={() => setLeftCollapsed(true)}
              onExpand={() => setLeftCollapsed(false)}
            />

            <div className="relative flex flex-1 overflow-hidden">
              <EditorCanvasStage />
            </div>

            <PropertiesPanel
              collapsed={rightCollapsed}
              onCollapse={() => setRightCollapsed(true)}
              onExpand={() => setRightCollapsed(false)}
              onOpenColor={() => setOverlay('color')}
            />
          </div>

          <StatusBar />
          <InitialSelection id="frame-landing" />
          <OverlayHost
            panel={overlay}
            onOpen={setOverlay}
            onClose={() => setOverlay(null)}
          />
        </div>
      </EditorInteractionProvider>
    </EditorProvider>
  );
}

function EditorTitleBar({
  projectName,
  onBack,
  onExport,
  onOpenSettings,
}: {
  projectName: string;
  onBack: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
}) {
  const editor = useEditor();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const off = editor.subscribe('viewportChange', () =>
      forceUpdate((t) => t + 1),
    );
    return off;
  }, [editor]);

  return (
    <TitleBar
      documentName={projectName}
      isDirty={false}
      zoom={editor.getViewport().zoom}
      onLogoClick={onBack}
      onExport={onExport}
      onOpenSettings={onOpenSettings}
    />
  );
}

function InitialSelection({ id }: { id: string }) {
  const editor = useEditor();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (editor.getDocument().layers[id]) editor.setSelection([id]);
  }, [editor, id]);
  return null;
}

// --- Sample document (fallback) ---

function base(
  id: string,
  name: string,
  parentId: string | null,
  index: number,
) {
  return {
    id,
    name,
    parentId,
    index,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    blendMode: 'normal' as const,
  };
}

function createSampleDocument(): DesignDocument {
  const doc = createDocument('Dashboard UI');
  const L = doc.layers as Record<string, unknown>;

  const PX = 60;
  const PY = 80;

  const rect = (
    id: string,
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string | undefined,
    parentId: string | null,
    index: number,
    opts: { radius?: number; stroke?: string; opacity?: number } = {},
  ) => {
    L[id] = {
      ...base(id, name, parentId, index),
      type: 'rectangle',
      x,
      y,
      width,
      height,
      fills: fill ? [{ type: 'solid', color: fill, opacity: 1 }] : [],
      strokes: opts.stroke
        ? [
            {
              color: opts.stroke,
              width: 1,
              style: 'solid',
              position: 'inside',
              opacity: 1,
            },
          ]
        : [],
      cornerRadius: opts.radius ?? 0,
      effects: [],
      ...(opts.opacity !== undefined ? { opacity: opts.opacity } : {}),
    };
  };

  const text = (
    id: string,
    name: string,
    x: number,
    y: number,
    content: string,
    fontSize: number,
    fontWeight: number,
    color: string,
    parentId: string | null,
    index: number,
  ) => {
    L[id] = {
      ...base(id, name, parentId, index),
      type: 'text',
      x,
      y,
      width: Math.max(10, content.length * fontSize * 0.55),
      height: fontSize * 1.4,
      content,
      fontFamily: 'Inter',
      fontWeight,
      fontSize,
      lineHeight: Math.round(fontSize * 1.3),
      letterSpacing: 0,
      textAlign: 'left',
      verticalAlign: 'top',
      textDecoration: 'none',
      textTransform: 'none',
      fills: [{ type: 'solid', color, opacity: 1 }],
      strokes: [],
      sizing: 'autoHeight',
      overflow: 'visible',
    };
  };

  // --- Landing Page frame ---
  L['frame-landing'] = {
    ...base('frame-landing', 'Landing Page', null, 0),
    type: 'frame',
    x: PX,
    y: PY,
    width: 620,
    height: 430,
    children: [],
    layout: { enabled: false },
    sizingMode: { width: 'fixed', height: 'fixed' },
    fills: [{ type: 'solid', color: '#1A1A22', opacity: 1 }],
    strokes: [
      {
        color: '#2F2F3A',
        width: 1,
        style: 'solid',
        position: 'inside',
        opacity: 1,
      },
    ],
    cornerRadius: 12,
    effects: [],
    overflow: 'hidden',
    clipContent: true,
  };

  const landingChildren: string[] = [];
  const addLanding = (id: string) => landingChildren.push(id);

  rect(
    'lp-logodot',
    'Logo Dot',
    PX + 24,
    PY + 18,
    20,
    20,
    '#7C3AED',
    'frame-landing',
    0,
    { radius: 6 },
  );
  addLanding('lp-logodot');
  text(
    'lp-brand',
    'Brand',
    PX + 52,
    PY + 19,
    'design.ai',
    13,
    600,
    '#E4E4E7',
    'frame-landing',
    1,
  );
  addLanding('lp-brand');
  text(
    'lp-product',
    'Product',
    PX + 160,
    PY + 21,
    'Product',
    12,
    400,
    '#6E6E7A',
    'frame-landing',
    2,
  );
  addLanding('lp-product');
  text(
    'lp-features',
    'Features',
    PX + 240,
    PY + 21,
    'Features',
    12,
    400,
    '#6E6E7A',
    'frame-landing',
    3,
  );
  addLanding('lp-features');
  text(
    'lp-pricing',
    'Pricing',
    PX + 320,
    PY + 21,
    'Pricing',
    12,
    400,
    '#6E6E7A',
    'frame-landing',
    4,
  );
  addLanding('lp-pricing');
  rect(
    'lp-cta',
    'CTA',
    PX + 520,
    PY + 14,
    80,
    28,
    '#7C3AED',
    'frame-landing',
    5,
    { radius: 14 },
  );
  addLanding('lp-cta');
  text(
    'lp-cta-label',
    'CTA Label',
    PX + 532,
    PY + 21,
    'Get started',
    11.5,
    600,
    '#FFFFFF',
    'frame-landing',
    6,
  );
  addLanding('lp-cta-label');
  text(
    'lp-hero1',
    'Hero Title',
    PX + 40,
    PY + 92,
    'Build bold software',
    30,
    700,
    '#E4E4E7',
    'frame-landing',
    7,
  );
  addLanding('lp-hero1');
  text(
    'lp-hero2',
    'Hero Subtitle',
    PX + 40,
    PY + 132,
    'with an agentic canvas for design + code.',
    15,
    400,
    '#9CA3AF',
    'frame-landing',
    8,
  );
  addLanding('lp-hero2');
  rect(
    'lp-btn1',
    'Primary Btn',
    PX + 40,
    PY + 170,
    130,
    34,
    '#7C3AED',
    'frame-landing',
    9,
    { radius: 17 },
  );
  addLanding('lp-btn1');
  text(
    'lp-btn1-label',
    'Primary Label',
    PX + 59,
    PY + 180,
    'Start designing',
    12,
    600,
    '#FFFFFF',
    'frame-landing',
    10,
  );
  addLanding('lp-btn1-label');
  text(
    'lp-btn2-label',
    'Secondary Label',
    PX + 182,
    PY + 180,
    '▶ Watch demo',
    12,
    400,
    '#9CA3AF',
    'frame-landing',
    11,
  );
  addLanding('lp-btn2-label');
  rect(
    'lp-heroimg',
    'Hero Image',
    PX + 360,
    PY + 86,
    220,
    140,
    '#312E81',
    'frame-landing',
    12,
    { radius: 12 },
  );
  addLanding('lp-heroimg');
  text(
    'lp-acme',
    'acme',
    PX + 40,
    PY + 236,
    'acme',
    13,
    600,
    '#4A4A58',
    'frame-landing',
    13,
  );
  addLanding('lp-acme');
  text(
    'lp-northwind',
    'northwind',
    PX + 101,
    PY + 236,
    'northwind',
    13,
    600,
    '#4A4A58',
    'frame-landing',
    14,
  );
  addLanding('lp-northwind');
  text(
    'lp-lumina',
    'lumina',
    PX + 192,
    PY + 236,
    'lumina',
    13,
    600,
    '#4A4A58',
    'frame-landing',
    15,
  );
  addLanding('lp-lumina');
  text(
    'lp-vertex',
    'vertex',
    PX + 260,
    PY + 236,
    'vertex',
    13,
    600,
    '#4A4A58',
    'frame-landing',
    16,
  );
  addLanding('lp-vertex');
  text(
    'lp-halcyon',
    'halcyon',
    PX + 326,
    PY + 236,
    'halcyon',
    13,
    600,
    '#4A4A58',
    'frame-landing',
    17,
  );
  addLanding('lp-halcyon');

  const featureCards: Array<[string, string, string]> = [
    ['lp-feat1', 'AI-native', 'Describe it and the agent builds it.'],
    ['lp-feat2', 'Flex layout', 'Describe it and the agent builds it.'],
    ['lp-feat3', 'Code on canvas', 'Describe it and the agent builds it.'],
  ];
  featureCards.forEach(([id, title, sub], i) => {
    const x = PX + 40 + i * 184;
    rect(
      id,
      title,
      x,
      PY + 288,
      170,
      96,
      '#20202A',
      'frame-landing',
      18 + i * 3,
      { radius: 10, stroke: '#2F2F3A' },
    );
    addLanding(id);
    text(
      `${id}-t`,
      `${title} Title`,
      x + 12,
      PY + 322,
      title,
      12.5,
      600,
      '#E4E4E7',
      'frame-landing',
      19 + i * 3,
    );
    addLanding(`${id}-t`);
    text(
      `${id}-s`,
      `${title} Subtitle`,
      x + 12,
      PY + 343,
      sub,
      10.5,
      400,
      '#6E6E7A',
      'frame-landing',
      20 + i * 3,
    );
    addLanding(`${id}-s`);
  });

  (L['frame-landing'] as { children: string[] }).children = landingChildren;

  // --- Sticky note ---
  L['sticky-1'] = {
    ...base('sticky-1', 'Sticky Note', null, 1),
    type: 'stickyNote',
    x: 720,
    y: 470,
    width: 185,
    height: 156,
    content: 'AI agents can edit this canvas ✨',
    color: '#FBBF24',
    textColor: '#78350F',
    fontSize: 13,
    author: 'Alex',
  };

  // --- Dashboard UI frame (off-view) ---
  L['frame-dashboard'] = {
    ...base('frame-dashboard', 'Dashboard UI', null, 2),
    type: 'frame',
    x: 1500,
    y: 60,
    width: 430,
    height: 580,
    children: [
      'dash-sidebar',
      'dash-topbar',
      'dash-kpi',
      'dash-chart',
      'dash-table',
    ],
    layout: { enabled: true, direction: 'row', gap: 0, padding: 0 },
    sizingMode: { width: 'fixed', height: 'fixed' },
    fills: [{ type: 'solid', color: '#141418', opacity: 1 }],
    strokes: [],
    cornerRadius: 12,
    effects: [],
    overflow: 'hidden',
    clipContent: true,
  };
  rect(
    'dash-sidebar',
    'Sidebar',
    1500,
    60,
    96,
    580,
    '#1E1E24',
    'frame-dashboard',
    0,
  );
  rect(
    'dash-topbar',
    'Top Bar',
    1596,
    60,
    334,
    48,
    '#1E1E24',
    'frame-dashboard',
    1,
  );
  rect(
    'dash-kpi',
    'KPI Cards',
    1612,
    124,
    302,
    72,
    '#20202A',
    'frame-dashboard',
    2,
    { radius: 10 },
  );
  rect(
    'dash-chart',
    'Revenue Chart',
    1612,
    208,
    302,
    180,
    '#20202A',
    'frame-dashboard',
    3,
    { radius: 10 },
  );
  rect(
    'dash-table',
    'Table',
    1612,
    400,
    302,
    200,
    '#20202A',
    'frame-dashboard',
    4,
    { radius: 10 },
  );

  // --- Misc top-level layers ---
  rect('rect-4', 'Rectangle 4', 60, 560, 160, 100, '#26262E', null, 3);
  text(
    'text-1',
    'Text',
    60,
    680,
    'Design is code',
    14,
    500,
    '#E4E4E7',
    null,
    4,
  );

  doc.rootLayerIds = [
    'frame-dashboard',
    'frame-landing',
    'sticky-1',
    'rect-4',
    'text-1',
  ];
  return doc;
}
