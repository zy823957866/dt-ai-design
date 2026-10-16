import type { PropertySection } from './PropertySection';
import { HeaderSection } from './sections/HeaderSection';
import { PositionSection } from './sections/PositionSection';
import { LayoutSection } from './sections/LayoutSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { FillSection } from './sections/FillSection';
import { StrokeSection } from './sections/StrokeSection';
import { EffectsSection } from './sections/EffectsSection';

export const PROPERTY_SECTIONS: PropertySection[] = [
  HeaderSection,
  PositionSection,
  LayoutSection,
  AppearanceSection,
  FillSection,
  StrokeSection,
  EffectsSection,
];
