import { provideZonelessChangeDetection } from '@angular/core';
import { render } from '@testing-library/angular';

import { IconComponent } from './icon.component';
import type { IconName } from './icon.component';

const ICON_NAMES: readonly IconName[] = [
  'chevron-left',
  'chevron-right',
  'calendar',
  'history',
  'settings',
  'trash',
];

describe('IconComponent', () => {
  it.each(ICON_NAMES)('renders an svg for "%s"', async (name) => {
    const { container } = await render(IconComponent, {
      inputs: { name },
      providers: [provideZonelessChangeDetection()],
    });

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('defaults to a 24px decorative size', async () => {
    const { container } = await render(IconComponent, {
      inputs: { name: 'settings' },
      providers: [provideZonelessChangeDetection()],
    });

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('renders at the given inline size', async () => {
    const { container } = await render(IconComponent, {
      inputs: { name: 'settings', size: 20 },
      providers: [provideZonelessChangeDetection()],
    });

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });
});
