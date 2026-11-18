import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-forgot-password',
	standalone: true,
	imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
	template: `
		<section class="login-page">
			<mat-card class="login-card" appearance="outlined">
				<h2>Forgot password</h2>
				@if (sent()) {
					<p>If the account exists, reset instructions have been sent.</p>
				} @else {
					<form [formGroup]="form" (ngSubmit)="submit()">
						<mat-form-field appearance="outline">
							<mat-label>Email</mat-label>
							<input matInput type="email" formControlName="email">
						</mat-form-field>
						@if (errorMessage()) {
							<p class="form-error">{{ errorMessage() }}</p>
						}
						<button mat-flat-button class="submit-button" type="submit" [disabled]="isSubmitting()">Send reset link</button>
					</form>
				}
				<a class="back-link" routerLink="/login">Back to login</a>
			</mat-card>
		</section>
	`,
	styleUrl: '../login/login.component.css'
})
export class ForgotPasswordComponent {
	private readonly authService = inject(AuthService);
	protected readonly isSubmitting = signal(false);
	protected readonly sent = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly form = inject(FormBuilder).nonNullable.group({
		email: ['', [Validators.required, Validators.email]]
	});

	protected async submit(): Promise<void> {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		this.isSubmitting.set(true);
		this.errorMessage.set(null);
		try {
			await this.authService.forgotPassword(this.form.controls.email.value.trim());
			this.sent.set(true);
		} catch (error) {
			this.errorMessage.set(AuthService.toMessage(error));
		} finally {
			this.isSubmitting.set(false);
		}
	}
}
