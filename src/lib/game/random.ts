/** Dart VM's seeded MWC stream. See assets/licenses/dart-sdk.txt and model documentation. */
export class DartRandom {
  private state: bigint;
  constructor(seed: number | bigint) {
    const u64 = (n: bigint) => BigInt.asUintN(64,n);
    let n=u64(BigInt(seed));
    n=u64(~n+(n<<21n)); n^=n>>24n;
    n=u64(n*265n); n^=n>>14n;
    n=u64(n*21n); n^=n>>28n;
    n=u64(n+(n<<31n));
    this.state=n || 0x5a17n;
    for (let i=0;i<4;i++) this.step();
  }
  private step() {
    this.state=BigInt.asUintN(64,0xffffda61n*(this.state&0xffffffffn)+(this.state>>32n));
    return Number(this.state&0xffffffffn);
  }
  nextInt(max: number): number {
    if (!Number.isInteger(max) || max<=0 || max>2**32) throw new RangeError('Random bound must be 1..2^32');
    let n,result;
    do { n=this.step(); result=n%max; } while (n-result+max>2**32);
    return result;
  }
  chance(probability: number) { return this.nextInt(2**32)/2**32 < probability; }
}

/** Android Dart strings expose UTF-16 code units, including both halves of a surrogate pair. */
export function dungeonCodeSeed(code: string): number {
  let seed=0;
  for (let i=0;i<code.length;i++) seed+=code.charCodeAt(i);
  return seed;
}
