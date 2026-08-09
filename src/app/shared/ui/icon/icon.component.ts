import { Component, input } from '@angular/core';

// DailyTrainer_CHARTE_GRAPHIQUE.md section 6 — Tabler Icons, outline only, stroke 1.5-2px.
// Only the icons this app actually uses are included: adding a new one means adding both a
// name here and its <path> data in the template, not pulling in the full @tabler/icons package
// for six icons' worth of SVG paths.
export type IconName =
  'chevron-left' | 'chevron-right' | 'calendar' | 'history' | 'settings' | 'trash';

@Component({
  selector: 'dt-icon',
  imports: [],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
})
export class IconComponent {
  readonly name = input.required<IconName>();
  // Section 6 — 20px inline (next to text) vs 24px decorative (standalone, e.g. in a button).
  readonly size = input<20 | 24>(24);
}
