import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PlacesApiService } from '../../core/services/places-api.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Photo, PlaceDetails, Tip } from '../../core/models/place.model';

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container" *ngIf="details() as place">
      <a routerLink="/" class="back">← Назад к поиску</a>

      <h1>{{ place.name }}</h1>
      <p class="category" *ngIf="place.categories?.length">{{ place.categories[0].name }}</p>
      <p class="address">
        {{ place.location?.formatted_address || place.location?.address }}
      </p>

      <div class="stats">
        <span *ngIf="place.rating">⭐ Рейтинг: {{ place.rating }}/10</span>
        <span *ngIf="place.price">💰 Цена: {{ '$'.repeat(place.price) }}</span>
        <span *ngIf="place.hours?.display">🕒 {{ place.hours?.display }}</span>
      </div>

      <button
        class="wishlist-btn"
        [class.active]="wishlist.isInWishlist(place.fsq_place_id)"
        (click)="wishlist.toggle(place)"
      >
        {{ wishlist.isInWishlist(place.fsq_place_id) ? '★ Убрать из списка' : '☆ Добавить в список' }}
      </button>

      <section *ngIf="photos().length">
        <h2>Фотографии</h2>
        <div class="photos">
          <img
            *ngFor="let photo of photos()"
            [src]="photo.prefix + '300x200' + photo.suffix"
            [alt]="place.name"
          />
        </div>
      </section>

      <section *ngIf="tips().length">
        <h2>Советы и отзывы</h2>
        <ul class="tips">
          <li *ngFor="let tip of tips()">{{ tip.text }}</li>
        </ul>
      </section>
    </div>

    <p class="container" *ngIf="loading()">Загрузка…</p>
    <p class="container error" *ngIf="error()">{{ error() }}</p>
  `,
  styles: [`
    .back { display: inline-block; margin: 16px 0; color: #4f8cff; }
    .category { color: #4f8cff; font-size: 13px; }
    .address { color: #666; }
    .stats { display: flex; gap: 18px; margin: 12px 0; font-size: 14px; }
    .wishlist-btn {
      border: 1px solid #f5a623;
      background: #fff;
      color: #f5a623;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .wishlist-btn.active { background: #fff7e6; }
    .photos { display: flex; gap: 10px; flex-wrap: wrap; }
    .photos img { border-radius: 8px; }
    .tips { padding-left: 20px; }
    .tips li { margin-bottom: 8px; color: #333; }
    .error { color: #d33; }
  `]
})
export class PlaceDetailComponent implements OnInit {
  readonly details = signal<PlaceDetails | null>(null);
  readonly photos = signal<Photo[]>([]);
  readonly tips = signal<Tip[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly placesApi: PlacesApiService,
    readonly wishlist: WishlistService
  ) {}

  ngOnInit(): void {
    const fsqId = this.route.snapshot.paramMap.get('id');
    if (!fsqId) {
      this.error.set('Место не найдено.');
      this.loading.set(false);
      return;
    }

    forkJoin({
      details: this.placesApi.getPlaceDetails(fsqId),
      photos: this.placesApi.getPlacePhotos(fsqId),
      tips: this.placesApi.getPlaceTips(fsqId)
    }).subscribe({
      next: ({ details, photos, tips }) => {
        this.details.set(details);
        this.photos.set(photos);
        this.tips.set(tips);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Не удалось загрузить информацию о месте.');
        this.loading.set(false);
      }
    });
  }
}
