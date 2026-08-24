import { Inject, Injectable } from '@angular/core';
import { BROWSER_STORAGE } from '../storage';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { TripData } from '../services/trip-data';

//Unused imports
/*
import { tap } from 'rxjs/internal/operators/tap';
import { Observable } from 'rxjs/internal/Observable';
*/

@Injectable({
  providedIn: 'root',
})

// AuthenticationService class handles user authentication and token management
export class AuthenticationService {
  authResp: AuthResponse = new AuthResponse();

  // Constructor injects the BROWSER_STORAGE and TripData services
  constructor(
    @Inject(BROWSER_STORAGE) private storage: Storage,
    private tripDataService: TripData       
  ) {}

  // Retrieve the token from storage for user authentication
  public getToken(): string {
    const token = this.storage.getItem('travlr-token');
    return token ? token : '';
  }

  // Save the token to storage for user authentication
  public saveToken(token: string): void {
    this.storage.setItem('travlr-token', token);
  }

  // Remove the token from storage to log out the user
  public logout(): void {
    this.storage.removeItem('travlr-token');
  }

  // Check if the user is logged in by verifying the token's expiration
  public isLoggedIn(): boolean {
    const token = this.getToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    }
    return false;
  }

  // Get the current user's information from the token
  public getCurrentUser(): User {
    const token = this.getToken();
    const { email, name } = JSON.parse(atob(token.split('.')[1]));
    return { email, name } as User;
  }
    // Login the user by calling the TripData service's login method
    public login(user: User, passwd: string): void {
        this.tripDataService.login(user, passwd)
            .subscribe({
            next: (value: AuthResponse) => {
                if (value) {
                console.log(value);
                this.authResp = value;
                this.saveToken(this.authResp.token);
                }
            },
            error: (error: any) => {
                console.log('Error: ' + error);
            }
            });
        }

    // Register the user by calling the TripData service's register method
    public register(user: User, passwd: string): void {
        this.tripDataService.register(user, passwd)
            .subscribe({
            next: (value: AuthResponse) => {
                if (value) {
                console.log(value);
                this.authResp = value;
                this.saveToken(this.authResp.token);
                }
            },
            error: (error: any) => {
                console.log('Error: ' + error);
            }
            });
        }
}