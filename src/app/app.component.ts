import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavUserComponent } from './components/nav-user/nav-user.component';
import { TranslatePipe } from './i18n/translate.pipe';
import { TranslationService } from './i18n/translation.service';
import { AuthService } from './services/auth.service';
import { CompareSelectionService } from './services/compare-selection.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatToolbarModule, NavUserComponent, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  protected readonly translation = inject(TranslationService);
  protected readonly compare = inject(CompareSelectionService);
  protected readonly isAdmin = computed(() => this.authService.hasRole('Admin'));
}
