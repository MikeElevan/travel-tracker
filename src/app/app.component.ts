import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { WishlistService } from './core/services/wishlist.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  template: `
    <header class="topbar">
      <a routerLink="/" class="logo">✈️ Трекер мест</a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          Поиск
        </a>
        <a routerLink="/wishlist" routerLinkActive="active">
          Мой список <span class="badge" *ngIf="wishlist.count() > 0">{{ wishlist.count() }}</span>
        </a>
      </nav>
    </header>

    <main>
      <router-outlet />
    </main>
  `,
  styles: [`
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      background: #1f2430;
      color: #fff;
    }
    .logo { font-weight: 700; font-size: 18px; color: #fff; }
    nav { display: flex; gap: 20px; }
    nav a { color: #cfd3dc; padding: 6px 4px; border-bottom: 2px solid transparent; }
    nav a.active { color: #fff; border-bottom-color: #4f8cff; }
    .badge {
      background: #4f8cff;
      color: #fff;
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 12px;
      margin-left: 4px;
    }
  `]
})
export class AppComponent {
  constructor(readonly wishlist: WishlistService) {}
}
