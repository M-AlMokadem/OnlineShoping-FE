import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { PasswordFieldComponent } from '../../components/password-field/password-field.component';

@Component({
	selector: 'app-reset-password',
	standalone: true,
	imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, PasswordFieldComponent],
	template: `
		<section class="login-page">
			<mat-card class="login-card" appearance="outlined">
				<h2>Reset password</h2>
				<form [formGroup]="form" (ngSubmit)="submit()">
					<mat-form-field appearance="outline">
						<mat-label>Email</mat-label>
						<input matInput type="email" formControlName="email">
					</mat-form-field>
					<mat-form-field appearance="outline">
						<mat-label>Reset token</mat-label>
						<input matInput type="text" formControlName="token">
					</mat-form-field>
					<app-password-field label="New password" placeholder="Minimum 8 characters" [required]="true" [minlength]="8" formControlName="newPassword"></app-password-field>
					@if (errorMessage()) {
						<p class="form-error">{{ errorMessage() }}</p>
					}
					<button mat-flat-button class="submit-button" type="submit" [disabled]="isSubmitting()">Reset password</button>
				</form>
				<a class="back-link" routerLink="/login">Back to login</a>
			</mat-card>
		</section>
	`,
	styleUrl: '../login/login.component.css'
})
export class ResetPasswordComponent {
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);
	protected readonly isSubmitting = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly form = inject(FormBuilder).nonNullable.group({
		email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
		token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
		newPassword: ['', [Validators.required, Validators.minLength(8)]]
	});

	protected async submit(): Promise<void> {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		this.isSubmitting.set(true);
		this.errorMessage.set(null);
		try {
			const { email, token, newPassword } = this.form.getRawValue();
			await this.authService.resetPassword(email.trim(), token.trim(), newPassword);
			await this.router.navigateByUrl('/login');
		} catch (error) {
			this.errorMessage.set(AuthService.toMessage(error));
		} finally {
			this.isSubmitting.set(false);
		}
	}
}
