import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { MatToolbarModule }    from '@angular/material/toolbar';
import { MatSidenavModule }    from '@angular/material/sidenav';
import { MatListModule }       from '@angular/material/list';
import { MatIconModule }       from '@angular/material/icon';
import { MatButtonModule }     from '@angular/material/button';
import { MatCardModule }       from '@angular/material/card';
import { MatTableModule }      from '@angular/material/table';
import { MatInputModule }      from '@angular/material/input';
import { MatSelectModule }     from '@angular/material/select';
import { MatDialogModule }     from '@angular/material/dialog';
import { MatSnackBarModule }   from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule }  from '@angular/material/paginator';
import { MatChipsModule }      from '@angular/material/chips';
import { MatBadgeModule }      from '@angular/material/badge';
import { MatTooltipModule }    from '@angular/material/tooltip';
import { MatMenuModule }       from '@angular/material/menu';

import { AppRoutingModule }    from './app-routing.module';
import { AppComponent }        from './app.component';
import { AuthInterceptor }     from './core/interceptors/auth.interceptor';
import { LayoutComponent }     from './shared/components/layout/layout.component';
import { LoginComponent }      from './features/auth/login/login.component';
import { RegisterComponent }   from './features/auth/register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    LoginComponent,
    RegisterComponent,
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule,
    HttpClientModule, ReactiveFormsModule, FormsModule,
    AppRoutingModule,
    MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule,
    MatButtonModule, MatCardModule, MatTableModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatSnackBarModule, MatDatepickerModule,
    MatNativeDateModule, MatPaginatorModule, MatChipsModule, MatBadgeModule,
    MatTooltipModule, MatMenuModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
