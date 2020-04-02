import { Component, OnInit } from '@angular/core';
import { Hero, HeroService } from '../../services/hero.service';
import { withLatestFrom, map } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';

interface HeroTableVm {
    heroes: Hero[];
    search: string;
    page: number;
    loading: boolean;
    totalHeroes: number;
    totalPages: number;
    limit: number;
}

@Component({
    selector: 'rx-hero-table',
    template: `
        <ng-container *ngIf="vm$ | async as vm">
            <!-- <h5 *ngIf="vm.loading"></h5> -->
            <div class="tool-bar">
                <span class="search-tool">
                    <label for="herosearch">Search: </label>
                    <input
                        name="herosearch"
                        [value]="vm.search"
                        (input)="hero.setSearch($event.target.value)"
                    />
                </span>
                <span class="page-tool">
                    <label>Page {{ vm.page }} of {{ vm.totalPages }} : </label>
                    <span class="buttons">
                        <button
                            class="prev"
                            [disabled]="vm.page <= 1"
                            (click)="hero.movePageBy(-1)"
                        >
                            Prev
                        </button>
                        <button
                            class="next"
                            [disabled]="vm.page === vm.totalPages"
                            (click)="hero.movePageBy(1)"
                        >
                            Next
                        </button>
                    </span>
                </span>
                <span class="result-tool">
                    <label>Show Results: </label>
                    <span class="buttons">
                        <button
                            *ngFor="let limit of hero.limits"
                            [disabled]="limit === vm.limit"
                            (click)="hero.setLimit(limit)"
                        >
                            {{ limit }}
                        </button>
                    </span>
                </span>
                <span class="total-tool">
                    <label>Total Results: {{ vm.totalHeroes }}</label>
                </span>
            </div>
            <div class="table-content">
                <rx-hero-badge
                    *ngFor="let hero of vm.heroes"
                    [hero]="hero"
                ></rx-hero-badge>
            </div>
        </ng-container>
    `,
    styleUrls: ['./hero-table.component.scss'],
})
export class HeroTableComponent {
    heroes: Hero[];

    vm$: Observable<HeroTableVm> = combineLatest([
        this.hero.totalPages$,
        this.hero.totalHeroes$,
        this.hero.heroes$,
        this.hero.loading$,
    ]).pipe(
        withLatestFrom(this.hero.search$, this.hero.page$, this.hero.limit$),
        map(
            ([
                [totalPages, totalHeroes, heroes, loading],
                search,
                page,
                limit,
            ]) => ({
                heroes,
                search,
                page: totalPages > 0 ? page + 1 : page,
                loading,
                totalHeroes,
                totalPages,
                limit,
            }),
        ),
    );

    constructor(public hero: HeroService) {}
}
