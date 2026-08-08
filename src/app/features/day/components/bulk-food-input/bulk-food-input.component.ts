import { Component, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { parseMultipleFoodInputs } from '../../../../core/domain/food-input-parser';
import type { ParsedFoodInput } from '../../../../core/models/parsed-food-input.model';

@Component({
  selector: 'dt-bulk-food-input',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './bulk-food-input.component.html',
  styleUrl: './bulk-food-input.component.css',
})
export class BulkFoodInputComponent {
  readonly parsed = output<ParsedFoodInput[]>();

  protected readonly text = signal('');

  protected onTextInput(event: Event): void {
    this.text.set((event.target as HTMLTextAreaElement).value);
  }

  protected onSubmit(): void {
    const entries = parseMultipleFoodInputs(this.text());
    if (entries.length === 0) {
      return;
    }
    this.parsed.emit(entries);
    this.text.set('');
  }
}
