


class Fact {
    constructor(a, b) {
        this.x = a;
        this.y = b;
        this.bin = 0;
        this.lastSeen = null;
        this.streak = 0;
        this.corrects = 0;
        this.mistakes = 0;
        this.deck = [];
        this.rnd = Math.random();
    }
    get a () {
        return this.rnd > 0.5 ? this.x : this.y;
    }
    get b () {
        return this.rnd > 0.5 ? this.y : this.x;
    }
    wrongAnswer () {
        this.bin = 1;
        this.streak = 0;
        this.mistakes++;
        this.lastSeen = new Date();
        this.rnd = Math.random();
    }
    rightAnswer () {
        this.bin = Math.min(++this.bin, 5);
        this.corrects++;
        this.streak++;
        this.lastSeen = new Date();
        this.rnd = Math.random();
    }
}

class Tables {
    constructor () {
        this.facts = [];
        [2,3,5,4,10,6,7,8,9,11,12].forEach( a => {
            for (let b = a; b <= 12; b++ ) {
                this.facts.push(new Fact(a, b))
            }
        });
    }
    createRound () {
        
        this.deck = this.facts.filter(f => f.bin == 1);

        let sorted = []
        for (let i of [0,1,2,3,4,5]) {
            sorted.push(this.facts.filter(f => f.bin == i).sort((a, b) => a.lastSeen - b.lastSeen))
        }

        let binWeights = [  0,0,  2,2,2,2,2,2,2,2,2,2,  3,3,3,3,3,  4,4,  5  ];
        
        while (this.deck.length < 21) {
            
            let targetBin = binWeights[Math.floor(Math.random() * binWeights.length)];
            let f = sorted[targetBin].shift();
           
            if (!f) continue;
            if (f.bin == 0) f.bin = 1;
            this.deck.push(f);
        }

        return this.deck.sort((a,b) => a.rnd - b.rnd);
    }

}

const tables = new Tables();

right.addEventListener('click', () => {
    if (!current) return
    current.rightAnswer();
    round = round.filter( f => f !== current);

    current = displayNext();

});

wrong.addEventListener('click', () => {
    if (!current) return
    current.wrongAnswer();
    
    current = displayNext();

});

newRound.addEventListener('click', () => {
    
    round = tables.createRound();
    current = displayNext();

});

function displayNext () {
   
    if (round.length == 0) {
        para.textContent = "done!";
        return;
    }
    q = round.pop();
    question1.textContent = q.a;
    question2.textContent = q.b;
     let str = '';
    [12,11,10,9,8,7,6,5,4,3,2].forEach( (value) => {
        for (let sp = 0 ; sp < value ; sp++) { str += ' '}
        for (let i = value;i <= 12; i++) {
            str += tables.facts.find( f => f.x == value && f.y == i).bin + ' ';
        }
        str += '<br>';
    });
    stats.innerHTML = str;
    return q;
}

let round = tables.createRound();
let current = displayNext();

