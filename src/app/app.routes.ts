import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/catalogue/catalogue.component').then((module) => module.CatalogueComponent)
	},
	{
		path: 'catalogue/:id',
		loadComponent: () => import('./pages/product-details/product-details.component').then((module) => module.ProductDetailsComponent)
	},
	{
		path: 'compare',
		loadComponent: () => import('./pages/compare/compare.component').then((module) => module.CompareComponent)
	},
	{
		path: 'login',
		loadComponent: () => import('./pages/login/login.component').then((module) => module.LoginComponent)
	},
	{
		path: 'forgot-password',
		loadComponent: () => import('./pages/forgot-password/forgot-password.component').then((module) => module.ForgotPasswordComponent)
	},
	{
		path: 'reset-password',
		loadComponent: () => import('./pages/reset-password/reset-password.component').then((module) => module.ResetPasswordComponent)
	},
	{
		path: 'register',
		loadComponent: () => import('./pages/register/register.component').then((module) => module.RegisterComponent)
	},
	{
		path: 'users',
		canActivate: [authGuard],
		data: { roles: ['Admin'] },
		loadComponent: () => import('./pages/users/users.component').then((module) => module.UsersComponent)
	},
	{
		path: 'products',
		canActivate: [authGuard],
		data: { roles: ['Admin', 'Seller'] },
		loadComponent: () => import('./pages/products/products.component').then((module) => module.ProductsComponent)
	},
	{
		path: '**',
		redirectTo: ''
	}
];
