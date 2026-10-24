import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RUBROS, LOGO, CORAZON } from '../../compartido/rubros';
import { Sprite } from '../../compartido/sprite';
import { Autenticacion } from '../../core/puertos';

@Component({
  selector: 'app-bienvenida',
  imports: [ReactiveFormsModule, Sprite],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.scss',
})
export class Bienvenida {
  private readonly auth = inject(Autenticacion);
  private readonly router = inject(Router);

  protected readonly logo = LOGO;
  protected readonly corazon = CORAZON;
  protected readonly rubros = Object.values(RUBROS);
  protected readonly error = signal('');
  protected readonly enviando = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required, Validators.minLength(4)]],
  });

  protected async ingresar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    try {
      const { email, clave } = this.form.getRawValue();
      await this.auth.ingresar(email, clave);
      await this.router.navigate(['/inicio']);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No pudimos iniciar sesión.');
    } finally {
      this.enviando.set(false);
    }
  }
}
