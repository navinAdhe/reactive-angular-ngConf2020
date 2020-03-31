import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import {
    map,
    switchMap,
    debounceTime,
    pluck,
    withLatestFrom,
    tap,
    distinctUntilChanged,
    shareReplay,
} from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ValueConverter } from '@angular/compiler/src/render3/view/template';

export interface Hero {
    id: number;
    name: string;
    description: string;
    thumbnail: HeroThumbnail;
    resourceURI: string;
    comics: HeroSubItems;
    events: HeroSubItems;
    series: HeroSubItems;
    stories: HeroSubItems;
}

export interface HeroThumbnail {
    path: string;
    extendion: string;
}

export interface HeroSubItems {
    available: number;
    returned: number;
    collectionURI: string;
    items: HeroSubItem[];
}

export interface HeroSubItem {
    resourceURI: string;
    name: string;
}

// The URL to the Marvel API
const HERO_API = `${environment.MARVEL_API.URL}/v1/public/characters`;

// Our Limits for Search
const LIMIT_LOW = 10;
const LIMIT_MID = 25;
const LIMIT_HIGH = 100;
const LIMITS = [LIMIT_LOW, LIMIT_MID, LIMIT_HIGH];

const initialState = {
    search: '',
    page: 0,
    limit: LIMIT_LOW,
};

interface HeroState {
    search: string;
    page: number;
    limit: number;
}

@Injectable({
    providedIn: 'root',
})
export class HeroService {
    limits = LIMITS;

    // BS is an observable. Promise puts out one thing but observable puts out multiple things over time.
    // BS should be private and not shared publicly.
    // move all BS's into a single state

    // private searchBS = new BehaviorSubject('');
    // private pageBS = new BehaviorSubject(0);
    // private limitBS = new BehaviorSubject(LIMIT_LOW);

    heroState$ = new BehaviorSubject<HeroState>(initialState);

    search$ = this.heroState$.pipe(
        pluck('search'),
        distinctUntilChanged(),
    ); // .asObservable();
    page$ = this.heroState$.pipe(
        pluck('page'),
        distinctUntilChanged(),
    ); // this.pageBS.asObservable();
    limit$ = this.heroState$.pipe(
        pluck('limit'),
        distinctUntilChanged(),
    ); // this.limitBS.asObservable();

    // Will have data only when you define it. Cannot put more stuff later unlike BehaviourSubjects or Subjects
    // foo: of(1);

    params$ = combineLatest([this.search$, this.page$, this.limit$]);

    heroesResponse$ = this.params$.pipe(
        debounceTime(100),
        tap(() => {
            this.heroState$.next({ ...this.heroState$.getValue() });
        }),
        switchMap(([search, page, limit]) => {
            const params1: any = {
                apikey: environment.MARVEL_API.PUBLIC_KEY,
                limit: `${limit}`,
                offset: `${page * limit}`,
            };

            if (search) {
                params1.nameStartsWith = search;
            }

            return this.http.get(HERO_API, {
                params: params1,
            });
        }),
        shareReplay(1), // to share the subscription
    );

    // heroes$ = this.heroesResponse$.pipe(map((res:any) => res.data.results));
    heroes$ = this.heroesResponse$.pipe(pluck('data', 'results'));
    totalHeroes$: Observable<number> = this.heroesResponse$.pipe(
        pluck('data', 'total'),
    );

    // wrong way: totalHeroes depends on limit. This will fire this combineLatest along with the first combinelatest.
    // totalPages$ = combineLatest([this.limitBS, this.totalHeroes$]).pipe(
    //     map(([limit, total]) => Math.ceil(total / limit))
    // )

    // only fires when totalHeroes fires
    totalPages$ = this.totalHeroes$.pipe(
        withLatestFrom(this.limit$),
        map(([total, limit]) => Math.ceil(total / limit)), // the order of total andd limit matters,
        tap(obs => console.log(obs)),
    );

    movePageBy(noOfPages) {
        // const newPage = this.pageBS.getValue() + noOfPages;
        // this.pageBS.next(newPage);

        const state = this.heroState$.getValue();
        const newPage = state.page + noOfPages;
        this.heroState$.next({ ...state, page: newPage });
    }

    setLimit(limitNumber) {
        // this.pageBS.next(0);
        // this.limitBS.next(limit)
        const state = this.heroState$.getValue();
        this.heroState$.next({ ...state, page: 0, limit: limitNumber });
    }

    setSearch(searchTerm) {
        // this.pageBS.next(0);
        // this.searchBS.next(searchTerm);
        const state = this.heroState$.getValue();
        this.heroState$.next({ ...state, page: 0, search: searchTerm });
    }

    constructor(private http: HttpClient) {}
}
