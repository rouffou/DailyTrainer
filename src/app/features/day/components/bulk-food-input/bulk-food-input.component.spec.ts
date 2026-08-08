import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { BulkFoodInputComponent } from './bulk-food-input.component';

describe('BulkFoodInputComponent', () => {
  it('emits parsed entries for a comma-separated sentence on submit', async () => {
    const { fixture } = await render(BulkFoodInputComponent, {
      providers: [provideZonelessChangeDetection()],
    });
    const emitted: unknown[] = [];
    fixture.componentInstance.parsed.subscribe((entries: unknown) => emitted.push(entries));

    await userEvent.type(
      screen.getByLabelText('Saisie multiple'),
      '100gr de bacon aldi, 500gr de crudités',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter tout' }));

    expect(emitted).toEqual([
      [
        { quantity: 100, unit: 'gr', name: 'bacon aldi' },
        { quantity: 500, unit: 'gr', name: 'crudités' },
      ],
    ]);
  });

  it('clears the textarea after a successful submit', async () => {
    await render(BulkFoodInputComponent, {
      providers: [provideZonelessChangeDetection()],
    });
    const textarea = screen.getByLabelText('Saisie multiple') as HTMLTextAreaElement;

    await userEvent.type(textarea, '100g de bacon');
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter tout' }));

    expect(textarea.value).toBe('');
  });

  it('does not emit and keeps the text when nothing parses', async () => {
    const { fixture } = await render(BulkFoodInputComponent, {
      providers: [provideZonelessChangeDetection()],
    });
    const emitted: unknown[] = [];
    fixture.componentInstance.parsed.subscribe((entries: unknown) => emitted.push(entries));
    const textarea = screen.getByLabelText('Saisie multiple') as HTMLTextAreaElement;

    await userEvent.type(textarea, 'pas une quantité valide');
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter tout' }));

    expect(emitted).toEqual([]);
    expect(textarea.value).toBe('pas une quantité valide');
  });
});
