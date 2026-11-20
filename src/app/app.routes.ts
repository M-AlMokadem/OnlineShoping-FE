import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./pages/home/home.component').then((module) => module.HomeComponent)
	},
	{
		path: 'catalogue',
		pathMatch: 'full',
		loadComponent: () => import('./pages/catalogue/catalogue.component').then((module) => module.CatalogueComponent)
	},
	{
		path: 'cart',
		loadComponent: () => import('./pages/cart/cart.component').then((module) => module.CartComponent)
	},
	{
		path: 'account',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/account/account.component').then((module) => module.AccountComponent)
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
		path: 'admin',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/admin/admin-layout.component').then((module) => module.AdminLayoutComponent),
		children: [
			{
				path: '',
				pathMatch: 'full',
				canActivate: [authGuard],
				data: { permissions: ['Products.View'] },
				loadComponent: () => import('./pages/dashboard/dashboard.component').then((module) => module.DashboardComponent)
			},
			{
				path: 'products',
				pathMatch: 'full',
				canActivate: [authGuard],
				data: { permissions: ['Products.View'] },
				loadComponent: () => import('./pages/products/products.component').then((module) => module.ProductsComponent)
			},
			{
				path: 'products/new',
				canActivate: [authGuard],
				canDeactivate: [unsavedChangesGuard],
				data: { permissions: ['Products.Create'] },
				loadComponent: () => import('./pages/product-form/product-form.component').then((module) => module.ProductFormComponent)
			},
			{
				path: 'products/:id',
				canActivate: [authGuard],
				canDeactivate: [unsavedChangesGuard],
				data: { permissions: ['Products.View'] },
				loadComponent: () => import('./pages/product-form/product-form.component').then((module) => module.ProductFormComponent)
			},
			{
				path: 'categories',
				canActivate: [authGuard],
				data: { permissions: ['Categories.Manage'] },
				loadComponent: () => import('./pages/categories/categories.component').then((module) => module.CategoriesComponent)
			},
			{
				path: 'brands',
				canActivate: [authGuard],
				data: { permissions: ['Brands.Manage'] },
				loadComponent: () => import('./pages/brands/brands.component').then((module) => module.BrandsComponent)
			},
			{
				path: 'users',
				canActivate: [authGuard],
				data: { permissions: ['Users.Manage'] },
				loadComponent: () => import('./pages/users/users.component').then((module) => module.UsersComponent)
			}
		]
	},
	{ path: 'products', pathMatch: 'full', redirectTo: 'admin/products' },
	{ path: 'products/new', pathMatch: 'full', redirectTo: 'admin/products/new' },
	{ path: 'products/:id', redirectTo: 'admin/products/:id' },
	{ path: 'categories', pathMatch: 'full', redirectTo: 'admin/categories' },
	{ path: 'brands', pathMatch: 'full', redirectTo: 'admin/brands' },
	{ path: 'users', pathMatch: 'full', redirectTo: 'admin/users' },
	{
		path: '**',
		redirectTo: ''
	}
];
