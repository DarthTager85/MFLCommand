/**
 * Realistic sample data — used automatically when the MFL API can't be reached
 * (private league, network error, or no League ID configured yet).
 * Shape matches what src/lib/mflApi.js loadLeagueData() returns.
 */

const P = (id, name, position, team, age, ppg, salary, contractYears) => ({
  id, name, position, team, age, ppg, salary, contractYears,
})

// Player database (id → info). Ages/PPG are realistic 2026 dynasty profiles.
export const SAMPLE_PLAYERS = [
  P('p1', 'Allen, Josh', 'QB', 'BUF', 30, 24.1, 38, 2),
  P('p2', 'Daniels, Jayden', 'QB', 'WAS', 25, 22.8, 18, 3),
  P('p3', 'Williams, Caleb', 'QB', 'CHI', 24, 19.5, 14, 3),
  P('p4', 'Robinson, Bijan', 'RB', 'ATL', 24, 18.2, 22, 2),
  P('p5', 'Gibbs, Jahmyr', 'RB', 'DET', 24, 17.6, 20, 3),
  P('p6', 'Barkley, Saquon', 'RB', 'PHI', 29, 16.9, 28, 1),
  P('p7', 'Henry, Derrick', 'RB', 'BAL', 32, 15.1, 24, 1),
  P('p8', 'Chase, Ja\'Marr', 'WR', 'CIN', 26, 18.4, 34, 2),
  P('p9', 'Jefferson, Justin', 'WR', 'MIN', 27, 17.8, 36, 3),
  P('p10', 'Nabers, Malik', 'WR', 'NYG', 23, 15.9, 12, 3),
  P('p11', 'Harrison, Marvin Jr.', 'WR', 'ARI', 24, 13.8, 13, 3),
  P('p12', 'Adams, Davante', 'WR', 'LAR', 33, 12.7, 22, 1),
  P('p13', 'Evans, Mike', 'WR', 'TB', 33, 13.5, 21, 1),
  P('p14', 'Bowers, Brock', 'TE', 'LV', 23, 13.1, 11, 3),
  P('p15', 'LaPorta, Sam', 'TE', 'DET', 25, 11.2, 12, 2),
  P('p16', 'Kelce, Travis', 'TE', 'KC', 37, 9.8, 16, 1),
  P('p17', 'Hall, Breece', 'RB', 'NYJ', 25, 14.8, 17, 2),
  P('p18', 'Worthy, Xavier', 'WR', 'KC', 23, 12.4, 8, 3),
  P('p19', 'Stroud, C.J.', 'QB', 'HOU', 25, 18.9, 16, 2),
  P('p20', 'Achane, De\'Von', 'RB', 'MIA', 25, 15.3, 13, 2),
  P('p21', 'Hunter, Travis', 'WR', 'JAC', 23, 12.9, 10, 4),
  P('p22', 'Jeanty, Ashton', 'RB', 'LV', 22, 14.2, 12, 4),
  P('p23', 'Wilson, Garrett', 'WR', 'NYJ', 26, 14.4, 19, 2),
  P('p24', 'McConkey, Ladd', 'WR', 'LAC', 25, 13.6, 11, 3),
  P('p25', 'Mahomes, Patrick', 'QB', 'KC', 31, 21.4, 40, 3),
  P('p26', 'Diggs, Stefon', 'WR', 'NE', 33, 10.8, 14, 1),
  P('p27', 'Mixon, Joe', 'RB', 'HOU', 30, 12.3, 15, 1),
  P('p28', 'Pearsall, Ricky', 'WR', 'SF', 25, 10.9, 7, 2),
]

export const SAMPLE_FREE_AGENTS = [
  P('fa1', 'Carter, Michael', 'RB', 'FA', 27, 6.2, 0, 0),
  P('fa2', 'Slayton, Darius', 'WR', 'FA', 29, 7.8, 0, 0),
  P('fa3', 'Hurst, Hayden', 'TE', 'FA', 33, 4.9, 0, 0),
  P('fa4', 'Dobbins, J.K.', 'RB', 'FA', 28, 9.4, 0, 0),
  P('fa5', 'Mims, Marvin', 'WR', 'FA', 24, 8.8, 0, 0),
]

const playersMap = {}
;[...SAMPLE_PLAYERS, ...SAMPLE_FREE_AGENTS].forEach((p) => { playersMap[p.id] = p })

export const SAMPLE_DATA = {
  source: 'sample',
  loadedAt: Date.now(),
  league: {
    name: 'Iron Bank Dynasty (Sample)',
    salaryCapAmount: 200,
    rosterSize: 25,
    franchises: [
      { id: '0001', name: 'My Team (You)', owner: 'Marc' },
      { id: '0002', name: 'Gridiron Goblins', owner: 'Dave' },
      { id: '0003', name: 'Cap Space Cowboys', owner: 'Sarah' },
      { id: '0004', name: 'Tank Commanders', owner: 'Mike' },
      { id: '0005', name: 'Dynasty Dons', owner: 'Priya' },
      { id: '0006', name: 'Future Considerations', owner: 'Tom' },
    ],
  },
  rosters: [
    { franchiseId: '0001', players: ['p2', 'p4', 'p8', 'p10', 'p14', 'p17', 'p22', 'p28'].map(wrap) },
    { franchiseId: '0002', players: ['p1', 'p6', 'p12', 'p13', 'p16', 'p27'].map(wrap) },
    { franchiseId: '0003', players: ['p25', 'p7', 'p9', 'p23', 'p15'].map(wrap) },
    { franchiseId: '0004', players: ['p3', 'p11', 'p18', 'p21', 'p24'].map(wrap) },
    { franchiseId: '0005', players: ['p19', 'p5', 'p20', 'p26'].map(wrap) },
    { franchiseId: '0006', players: [].map(wrap) },
  ],
  standings: [
    { franchiseId: '0002', wins: 9, losses: 2, ties: 0, pointsFor: 1480, pointsAgainst: 1210 },
    { franchiseId: '0003', wins: 8, losses: 3, ties: 0, pointsFor: 1422, pointsAgainst: 1250 },
    { franchiseId: '0001', wins: 6, losses: 5, ties: 0, pointsFor: 1318, pointsAgainst: 1300 },
    { franchiseId: '0005', wins: 5, losses: 6, ties: 0, pointsFor: 1255, pointsAgainst: 1310 },
    { franchiseId: '0004', wins: 2, losses: 9, ties: 0, pointsFor: 1090, pointsAgainst: 1405 },
    { franchiseId: '0006', wins: 1, losses: 10, ties: 0, pointsFor: 1010, pointsAgainst: 1460 },
  ],
  assets: [
    { franchiseId: '0001', currentPicks: ['1.05', '2.05'], futurePicks: ['2027 1st', '2027 3rd'] },
    { franchiseId: '0002', currentPicks: ['1.11', '3.11'], futurePicks: ['2027 2nd'] },
    { franchiseId: '0003', currentPicks: ['2.10'], futurePicks: ['2027 1st', '2028 1st'] },
    { franchiseId: '0004', currentPicks: ['1.01', '1.07', '2.01'], futurePicks: ['2027 1st', '2027 2nd', '2028 1st'] },
    { franchiseId: '0005', currentPicks: ['1.08', '2.08'], futurePicks: ['2027 2nd'] },
    { franchiseId: '0006', currentPicks: ['1.02', '2.02', '3.02'], futurePicks: ['2027 1st', '2028 2nd'] },
  ],
  tradeBait: [
    { franchiseId: '0002', willGiveUp: ['p12', 'p16'], inExchangeFor: 'Young WRs or 2026 2nds' },
    { franchiseId: '0004', willGiveUp: ['p24'], inExchangeFor: 'Future 1sts only' },
    { franchiseId: '0005', willGiveUp: ['p26'], inExchangeFor: 'Anything — cap dump' },
  ],
  players: playersMap,
  freeAgents: SAMPLE_FREE_AGENTS.map((p) => ({ id: p.id })),
}

function wrap(id) {
  const p = playersMap[id]
  return { id, status: 'ROSTER', salary: p.salary, contractYear: String(p.contractYears), contractInfo: '' }
}
