import type { PropertySection } from './PropertySection';
import { HeaderSection } from './sections/HeaderSection';
import { PositionSection } from './sections/PositionSection';
import { LayoutSection } from './sections/LayoutSection';
import { AppearanceSection } from './sections/AppearanceSection';

export const PROPERTY_SECTIONS: PropertySection[] = [
  HeaderSection,
  PositionSection,
  LayoutSection,
  AppearanceSection,
];
