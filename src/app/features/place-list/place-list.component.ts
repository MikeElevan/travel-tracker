import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Place } from '../../core/models/place.model';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-place-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="grid">
      <article class="card" *ngFor="let place of places">
        <a [routerLink]="['/place', place.fsq_place_id]" class="card-body">
          <h3>{{ place.name }}</h3>
          <p class="category" *ngIf="place.categories?.length">
            {{ place.categories[0].name }}
          </p>
          <p class="address">
            {{ place.location?.formatted_address || place.location?.address || 'Адрес не указан' }}
          </p>
        </a>
        <button
          class="wishlist-btn"
          [class.active]="wishlist.isInWishlist(place.fsq_place_id)"
          (click)="wishlist.toggle(place)"
        >
          {{ wishlist.isInWishlist(place.fsq_place_id) ? '★ В списке' : '☆ Добавить в список' }}
        </button>
      </article>
    </div>
  `,
  styles: [`
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .card {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .card-body { padding: 14px; flex: 1; }
    .card-body h3 { margin: 0 0 6px; font-size: 16px; }
    .category { color: #4f8cff; font-size: 12px; margin: 0 0 6px; }
    .address { color: #666; font-size: 13px; margin: 0; }
    .wishlist-btn {
      border: none;
      border-top: 1px solid #eee;
      background: #f8f9fc;
      padding: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }
    .wishlist-btn.active { color: #f5a623; background: #fff7e6; }
  `]
})
export class PlaceListComponent {
  @Input({ required: true }) places: Place[] = [];

  constructor(readonly wishlist: WishlistService) {}
}
