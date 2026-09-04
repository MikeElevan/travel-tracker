import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Произошла неизвестная ошибка';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Ошибка клиента: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 0:
            errorMessage = 'Нет подключения к сети или сервер недоступен';
            break;
          case 400:
            errorMessage = 'Некорректный запрос. Проверьте параметры поиска';
            break;
          case 401:
            errorMessage = 'Ошибка авторизации. Проверьте API-ключ';
            break;
          case 403:
            errorMessage = 'Доступ запрещён. Проверьте права доступа';
            break;
          case 404:
            errorMessage = 'Ресурс не найден';
            break;
          case 429:
            errorMessage = 'Слишком много запросов. Попробуйте позже';
            break;
          case 500:
            errorMessage = 'Ошибка сервера. Попробуйте позже';
            break;
          case 503:
            errorMessage = 'Сервис временно недоступен';
            break;
          default:
            errorMessage = `Ошибка ${error.status}: ${error.statusText}`;
        }
      }

      console.error('[HTTP Error]', {
        url: req.url,
        status: error.status,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });

      return throwError(() => new Error(errorMessage));
    })
  );
};