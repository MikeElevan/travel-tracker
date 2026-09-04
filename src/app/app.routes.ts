import { Routes } from '@angular/router';
import { SearchComponent } from './features/search/search.component';
import { PlaceDetailComponent } from './features/place-detail/place-detail.component';
import { WishlistComponent } from './features/wishlist/wishlist.component';

export const routes: Routes = [
  { path: '', component: SearchComponent, title: 'Поиск мест' },
  { path: 'place/:id', component: PlaceDetailComponent, title: 'Детали места' },
  { path: 'wishlist', component: WishlistComponent, title: 'Мой список' },
  { path: '**', redirectTo: '' }
];
