import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';

import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  it('renders the wordmark by default', async () => {
    await render(LogoComponent, {
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.getByText('DailyTrainer')).toBeTruthy();
  });

  it('hides the wordmark and labels the mark for screen readers in the "mark" variant', async () => {
    await render(LogoComponent, {
      inputs: { variant: 'mark' },
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.queryByText('DailyTrainer')).toBeNull();
    expect(screen.getByRole('img', { name: 'DailyTrainer' })).toBeTruthy();
  });
});
