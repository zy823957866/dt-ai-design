import type { PropertySection } from './PropertySection';
import { HeaderSection } from './sections/HeaderSection';
import { AlignmentSection } from './sections/AlignmentSection';
import { PositionSection } from './sections/PositionSection';
import { LayoutSection } from './sections/LayoutSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { FillSection } from './sections/FillSection';
import { StrokeSection } from './sections/StrokeSection';
import { TypographySection } from './sections/TypographySection';
import { EffectsSection } from './sections/EffectsSection';
import { BrowserSection } from './sections/BrowserSection';
import { ExportSection } from './sections/ExportSection';
import { MetadataSection } from './sections/MetadataSection';

export const PROPERTY_SECTIONS: PropertySection[] = [
  HeaderSection,
  AlignmentSection,
  PositionSection,
  LayoutSection,
  AppearanceSection,
  FillSection,
  StrokeSection,
  TypographySection,
  EffectsSection,
  BrowserSection,
  ExportSection,
  MetadataSection,
];
