import { Injectable, computed, signal } from '@angular/core';
import { Place, WishlistItem } from '../models/place.model';

const STORAGE_KEY = 'travel-tracker:wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly _items = signal<WishlistItem[]>(this.loadFromStorage());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  isInWishlist(fsqId: string): boolean {
    return this._items().some((item) => item.place.fsq_place_id  === fsqId);
  }

  add(place: Place): void {
    if (this.isInWishlist(place.fsq_place_id )) {
      return;
    }
    const updated: WishlistItem[] = [...this._items(), { place, addedAt: Date.now() }];
    this._items.set(updated);
    this.saveToStorage(updated);
  }

  remove(fsqId: string): void {
    const updated = this._items().filter((item) => item.place.fsq_place_id !== fsqId);
    this._items.set(updated);
    this.saveToStorage(updated);
  }

  toggle(place: Place): void {
    if (this.isInWishlist(place.fsq_place_id)) {
      this.remove(place.fsq_place_id);
    } else {
      this.add(place);
    }
  }

  private loadFromStorage(): WishlistItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
    } catch (error) {
      console.error('Не удалось прочитать wishlist из localStorage', error);
      return [];
    }
  }

  private saveToStorage(items: WishlistItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Не удалось сохранить wishlist в localStorage', error);
    }
  }
}
