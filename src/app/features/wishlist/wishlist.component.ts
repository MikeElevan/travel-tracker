import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <h1>Мой список желаемых мест</h1>

      <p *ngIf="!wishlist.items().length">
        Пока пусто. Найдите места на странице поиска и добавьте их сюда.
      </p>

      <ul class="list" *ngIf="wishlist.items().length">
        <li *ngFor="let item of wishlist.items()">
          <a [routerLink]="['/place', item.place.fsq_place_id]">
            <strong>{{ item.place.name }}</strong>
            <span class="category" *ngIf="item.place.categories?.length">
              · {{ item.place.categories[0].name }}
            </span>
          </a>
          <span class="address">
            {{ item.place.location?.formatted_address || item.place.location?.address }}
          </span>
          <button (click)="wishlist.remove(item.place.fsq_place_id)">Удалить</button>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .list { list-style: none; padding: 0; margin-top: 16px; }
    .list li {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .list li > a { flex: 1; }
    .category { color: #4f8cff; font-size: 13px; }
    .address { color: #777; font-size: 13px; flex: 1; }
    button {
      border: 1px solid #d33;
      color: #d33;
      background: #fff;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
    }
  `]
})
export class WishlistComponent {
  constructor(readonly wishlist: WishlistService) {}
}
