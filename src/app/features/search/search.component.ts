import { Component, OnDestroy, OnInit, effect, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  tap
} from 'rxjs';
import { PlacesApiService, SearchLocation } from '../../core/services/places-api.service';
import { Place } from '../../core/models/place.model';
import { PlaceListComponent } from '../place-list/place-list.component';

const DEBOUNCE_MS = 500;
const ITEMS_PER_PAGE = 10;
const SCROLL_THRESHOLD = 200;

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PlaceListComponent],
  template: `
    <div class="container">
      <h1>Найдите места для путешествий</h1>

      <form class="search-form" [formGroup]="form">
        <input
          type="text"
          formControlName="query"
          placeholder="Ключевое слово (например: кофейня, музей)"
          [disabled]="!usingGeolocation()"
        />
        <button
          type="button"
          class="geo-btn"
          (click)="useMyLocation()"
          [disabled]="geoLoading()"
        >
          {{ geoLoading() ? 'Определяем…' : '📍 Моя геолокация' }}
        </button>
        <span class="search-status">{{ loading() ? 'Ищем…' : '' }}</span>
      </form>

      <p class="error" *ngIf="!usingGeolocation() && !geoLoading()">
        ⚠️ Поиск невозможен без геолокации. Нажмите кнопку «Моя геолокация» для определения вашего местоположения.
      </p>

      <p class="hint" *ngIf="usingGeolocation()">
        📍 Поиск ведётся по вашим текущим координатам.
        <button type="button" class="link-btn" (click)="clearGeolocation()">Сбросить</button>
      </p>

      <p class="hint" *ngIf="fromCache()">
        ⚡ Результаты показаны из кэша (не старше 10 минут) — новый запрос к API не отправлялся.
      </p>

      <p class="error" *ngIf="error()">{{ error() }}</p>
      <p class="error" *ngIf="geoError()">{{ geoError() }}</p>

      <app-place-list *ngIf="places().length" [places]="places()"></app-place-list>

      <div class="pagination-controls" *ngIf="places().length">
        <p class="results-info">
          Показано {{ places().length }} из {{ totalResults() }} результатов
        </p>
        <button
          *ngIf="hasMore()"
          class="load-more-btn"
          (click)="loadMore()"
          [disabled]="loadingMore()"
        >
          {{ loadingMore() ? 'Загрузка…' : 'Загрузить ещё' }}
        </button>
      </div>

      <div #scrollAnchor class="scroll-anchor"></div>

      <p *ngIf="searched() && !loading() && !places().length && !error()">
        Ничего не найдено. Попробуйте другой запрос.
      </p>
    </div>
  `,
  styles: [`
    h1 { margin-top: 24px; }
    .search-form {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .search-form input {
      flex: 1 1 220px;
      padding: 10px 12px;
      border: 1px solid #d3d7e0;
      border-radius: 8px;
      font-size: 14px;
    }
    .search-form input:disabled { background: #f1f2f6; color: #999; }
    .search-form button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #4f8cff;
      color: #fff;
      font-weight: 600;
    }
    .search-form button:disabled { background: #a9c2ee; cursor: not-allowed; }
    .geo-btn { background: #34a853; }
    .geo-btn:disabled { background: #a6d8b4; }
    .search-status { color: #000000; padding: 10px 20px; border-radius: 8px; font-weight: 600; min-width: 80px; text-align: center; display: inline-block; }
    .hint { color: #4f8cff; font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .link-btn {
      background: none;
      border: none;
      padding: 0;
      color: #4f8cff;
      text-decoration: underline;
      font-size: 13px;
      font-weight: 400;
    }
    .error { color: #d33; }
    .pagination-controls {
      margin-top: 20px;
      text-align: center;
    }
    .results-info {
      color: #666;
      font-size: 13px;
      margin-bottom: 10px;
    }
    .load-more-btn {
      padding: 10px 24px;
      border: 1px solid #4f8cff;
      border-radius: 8px;
      background: #fff;
      color: #4f8cff;
      font-weight: 600;
      cursor: pointer;
    }
    .load-more-btn:hover:not(:disabled) {
      background: #4f8cff;
      color: #fff;
    }
    .load-more-btn:disabled {
      border-color: #a9c2ee;
      color: #a9c2ee;
      cursor: not-allowed;
    }
    .scroll-anchor {
      height: 1px;
      margin-top: 20px;
    }
  `]
})
export class SearchComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef;

  readonly form = this.fb.group({
    query: ['', Validators.required],
    near: ['']
  });

  readonly places = signal<Place[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searched = signal(false);
  readonly fromCache = signal(false);
  readonly loadingMore = signal(false);
  readonly usingGeolocation = signal(false);
  readonly geoLoading = signal(false);
  readonly geoError = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly hasMore = signal(true);
  readonly totalResults = signal(0);
  private coords: { latitude: number; longitude: number } | null = null;

  /** Через этот Subject прогоняем как ручной submit, так и debounce-триггеры. */
  private readonly search$ = new Subject<void>();
  private subscription?: Subscription;
  private allResults: Place[] = [];
  private intersectionObserver?: IntersectionObserver;

  constructor(private readonly fb: FormBuilder, private readonly placesApi: PlacesApiService) {
    effect(() => {
      const queryControl = this.form.get('query');
      if (this.usingGeolocation()) {
        queryControl?.enable();
      } else {
        queryControl?.disable();
      }
    });
  }

  ngOnInit(): void {
    const autoSearch$ = this.form.valueChanges.pipe(
      debounceTime(DEBOUNCE_MS),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      filter(() => this.canSearch()),
      tap(() => this.search$.next())
    );

    this.subscription = new Subscription();
    this.subscription.add(autoSearch$.subscribe());

    this.subscription.add(
      this.search$
        .pipe(
          tap(() => {
            this.loading.set(true);
            this.error.set(null);
            this.searched.set(true);
            this.currentPage.set(1);
            this.hasMore.set(true);
            this.allResults = [];
          }),
          switchMap(() => {
            const requestStartedAt = Date.now();
            return this.placesApi.searchPlaces(this.currentQuery(), this.currentLocation()).pipe(
              tap({
                next: () => this.fromCache.set(Date.now() - requestStartedAt < 30)
              })
            );
          })
        )
        .subscribe({
          next: (results) => {
            this.allResults = results;
            this.totalResults.set(results.length);
            this.places.set(results.slice(0, ITEMS_PER_PAGE));
            this.hasMore.set(results.length > ITEMS_PER_PAGE);
            this.loading.set(false);
          },
          error: () => {
            this.error.set(
              'Не удалось загрузить места. Проверьте API-ключ Foursquare в environment.ts и подключение к сети.'
            );
            this.places.set([]);
            this.loading.set(false);
          }
        })
    );
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.intersectionObserver?.disconnect();
  }

  private setupIntersectionObserver(): void {
    if (!this.scrollAnchor) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore() && !this.loading() && !this.loadingMore()) {
          this.loadMore();
        }
      },
      { rootMargin: `${SCROLL_THRESHOLD}px` }
    );

    this.intersectionObserver.observe(this.scrollAnchor.nativeElement);
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);
    this.currentPage.update(page => page + 1);

    setTimeout(() => {
      const nextPage = this.currentPage();
      const endIndex = nextPage * ITEMS_PER_PAGE;
      this.places.set(this.allResults.slice(0, endIndex));
      this.hasMore.set(endIndex < this.allResults.length);
      this.loadingMore.set(false);
    }, 300);
  }

  useMyLocation(): void {
    if (!('geolocation' in navigator)) {
      this.geoError.set('Геолокация не поддерживается этим браузером.');
      return;
    }

    this.geoLoading.set(true);
    this.geoError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        this.usingGeolocation.set(true);
        this.geoLoading.set(false);
        this.form.get('near')!.setValue('', { emitEvent: false });
        if (this.canSearch()) {
          this.search$.next();
        }
      },
      (err) => {
        this.geoLoading.set(false);
        this.geoError.set(
          err.code === err.PERMISSION_DENIED
            ? 'Доступ к геолокации запрещён. Разрешите его в настройках браузера или введите город вручную.'
            : 'Не удалось определить геолокацию. Введите город вручную.'
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }

  clearGeolocation(): void {
    this.coords = null;
    this.usingGeolocation.set(false);
  }

  private canSearch(): boolean {
    const query = this.form.get('query')!.value?.trim();
    const near = this.form.get('near')!.value?.trim();
    return !!query && (!!near || this.usingGeolocation());
  }

  private currentQuery(): string {
    return this.form.get('query')!.value!.trim();
  }

  private currentLocation(): SearchLocation {
    if (this.usingGeolocation() && this.coords) {
      return { kind: 'coords', latitude: this.coords.latitude, longitude: this.coords.longitude };
    }
    return { kind: 'near', near: this.form.get('near')!.value!.trim() };
  }
}
