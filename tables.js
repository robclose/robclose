let currentUser = "rob";

class Fact {
    constructor(obj) {
        this.x = obj.x;
        this.y = obj.y;
        this.bin = obj.bin ?? 0;
        this.lastSeen = obj.lastSeen ?? null;
        this.streak = obj.streak ?? 0;
        this.corrects = obj.corrects ?? 0;
        this.mistakes = obj.mistakes ?? 0;
        this.rnd = Math.random();
    }
    get a () {
        return this.rnd > 0.5 ? this.x : this.y;
    }
    get b () {
        return this.rnd > 0.5 ? this.y : this.x;
    }
    answered (correct) {
        if (correct) {
            this.bin = Math.min(++this.bin, 5);
            this.corrects++;
            this.streak++;
        } else {
            this.bin = 1;
            this.streak = 0;
            this.mistakes++;
        }
        this.lastSeen = new Date();
        this.rnd = Math.random();
        tables.save(currentUser);
    }
}

class Tables {
    constructor () {
        this.facts = [];
        [2,3,5,4,10,6,7,8,9,11,12].forEach( a => {
            for (let b = a; b <= 12; b++ ) {
                this.facts.push(new Fact({x:a, y:b}))
            }
        });
        this.round = [];
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

        this.round = this.deck.sort((a,b) => a.rnd - b.rnd);
    }
    next () {
        return this.round.pop();
    }

    save (username) {
        let factExport = JSON.stringify(this.facts.map( f => {
            let ex = {...f};
            delete ex.rnd;
            return ex
        }));
        
        localStorage.setItem(username, factExport);

    }
    load (username) {
        this.facts = JSON.parse(localStorage.getItem(username)).map( f => new Fact(f))
    }

}

let tables = new Tables();
if (currentUser) {tables.load(currentUser);}

right.addEventListener('click', () => {
    if (!current) return
    current.answered(true);

    current = displayNext();

});

wrong.addEventListener('click', () => {
    if (!current) return
    current.answered(false);
    
    current = displayNext();

});

newRound.addEventListener('click', () => {
    
    tables.createRound();
    current = displayNext();

});

reset.addEventListener('click', () => {
    
    tables = new Tables();
    tables.save(currentUser);
    tables.createRound();
    current = displayNext();

});

function displayNext () {

    q = tables.next();
    if (!q) {
        para.textContent = "done!";
        return;
    } else {
        para.textContent = "in prog!";
    }
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

tables.createRound();
let current = displayNext();

