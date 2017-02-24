(function() {

function shuffleArray(list) {
    var i, j, t;
    for (i = 1; i < list.length; i++) {
        j = Math.floor(Math.random()*(1+i));
        if (j != i) {
            t = list[i];
            list[i] = list[j];
            list[j] = t;
        }
    }
}

function objectInArray(object, array) {
    for (var i=0; i < array.length; i++) {
        if (array[i].row == object.row && array[i].col == object.col) {
            return true;
        }
    }
    return false
}

function Grid(dict) {
    this.rows    = isNaN(dict.rows)   ? 1    : dict.rows;
    this.cols    = isNaN(dict.cols)   ? 1    : dict.cols;
    this.width   = isNaN(dict.width)  ? 100  : dict.width;
    this.height  = isNaN(dict.height) ? 100  : dict.height;
    this.left    = isNaN(dict.left)   ? 0    : dict.left;
    this.bottom  = isNaN(dict.bottom) ? 0    : dict.bottom;
    this.pad     = isNaN(dict.pad)    ? 1    : dict.pad;
    this.marg    = isNaN(dict.marg)   ? 1.1  : dict.marg;
    this.square  = isNaN(dict.square) ? true : dict.square;
    
    var X       = $(window).width();
    var Y       = $(window).height();
    this.left   = (this.left/100)*X;
    this.bottom = (this.bottom/100)*Y;
    this.width  = (this.width/100)*X;
    this.height = (this.height/100)*Y;
    this.pad    = (this.pad/100)*Math.min(X,Y);
    
    this.ele = $(document.createElement('div'));
    this.ele.addClass('grid');
    this.ele.css({
        'left': this.left,
        'bottom': this.bottom,
        'width': this.width,
        'height': this.height
    });
    $('body').append(this.ele);
    
    this.entries = this.getBlankGrid();
    this.setBase();
}

Grid.prototype.setBase = function() {
    this.entryW  = this.width/(this.cols + 2*this.marg) - this.pad;
    this.entryH  = this.height/(this.rows + 2*this.marg) - this.pad;
    
    if (this.square) {
        var min = Math.min(this.entryW, this.entryH);
        this.entryW = min;
        this.entryH = min;
    }
    
    this.totalW = this.entryW*(this.cols + 2*this.marg) + this.pad*(this.cols-1);
    this.totalH = this.entryH*(this.rows + 2*this.marg) + this.pad*(this.rows-1);
    
    this.offW   = (this.width - this.totalW)/2 + this.left;
    this.offH   = (this.height - this.totalH)/2 + this.bottom;
};

Grid.prototype.getBlankGrid = function() {
    var blank = [];
    for (var row=0; row < this.rows; row++) {
        blank.push([]);
        for (var col=0; col < this.cols; col++) {
            blank[row].push(null);
        }
    }
    return blank;
};

Grid.prototype.getObject = function(row, col) {
    row = isNaN(row) ? 0 : row;
    col = isNaN(col) ? 0 : col;
    if (row >= this.rows || row < 0) {
        throw 'Index Error: Row out of range';
    }
    if (col >= this.cols || col < 0) {
        throw 'Index Error: Col out of range';
    }
    return this.entries[row][col];
};

Grid.prototype.addObject = function(object, row, col) {
    row = isNaN(row) ? 0 : row;
    col = isNaN(col) ? 0 : col;
    if (this.getObject(row,col)) {
        throw 'Grid Error: This slot is full';
    }
    this.entries[row][col] = object;
    object.setAttribs(this.getPosition(row, col));
    object.row    = row;
    object.orow   = row;
    object.col    = col;
    object.ocol   = col;
    object.ele.attr({'row': row, 'col': col})
    return object;
};

Grid.prototype.next = function() {
    var row = 0;
    var col = 0;
    while (true) {
        if (!this.getObject(row, col)) {
            return {'row': row, 'col': col};
        }
        col += 1
        if (col == this.cols) {
            row += 1;
            if (row == this.rows) {
                throw 'Grid Error: Grid is full, there is no next';
            }
            else {
                col = 0;
            }
        }
    }
};

Grid.prototype.first = function() {
    var row = 0;
    var col = 0;
    while (true) {
        object = this.getObject(row, col);
        if (object) {
            return {'row': row, 'col': col};
        }
        col += 1
        if (col == this.cols) {
            row += 1;
            if (row == this.rows) {
                throw 'Grid Error: Grid is empty, there is no first';
            }
        }
    }
};

Grid.prototype.popObject = function() {
    var pos = this.first();
    return this.getObject(pos.row, pos.col);
};

Grid.prototype.pushObject = function(object) {
    var pos = this.next();
    this.addObject(object, pos.row, pos.col);
    object.ele.attr({'row': pos.row, 'col': pos.col});
};

Grid.prototype.removeObject = function(row, col) {
    this.entries[row][col] = null;
    // empty line
};

Grid.prototype.deleteObject = function(row, col) {
    this.getObject(row, col).remove();
    this.entries[row][col] = null;
};

Grid.prototype.drawObjects = function(ease, dur, order) {
    if (order) {
        this.timer = setInterval((function(context, row, col) {
            return function() {
                var current = context.getObject(row,col);
                if (current) {
                    current.draw(ease, dur);
                }
                col += 1;
                if (col == context.cols) {
                    row += 1;
                    if (row == context.rows) {
                        clearInterval(context.timer);
                    }
                    else {
                        col = 0;
                    }
                }
            }
        })(this, 0, 0), dur);
    }
    else {
        for (var row=0; row < this.rows; row++) {
            for (var col=0; col < this.cols; col++) {
                current = this.getObject(row,col);
                if (current) {
                    current.draw(ease, dur);
                }
            }
        }
    }
};

Grid.prototype.hideObjects = function(ease, dur, order) {
    if (order) {
        this.timer = setInterval((function(context, row, col) {
            return function() {
                var current = context.getObject(row,col);
                if (current) {
                    current.hide(ease, dur);
                }
                col += 1;
                if (col == context.cols) {
                    row += 1;
                    if (row == context.rows) {
                        clearInterval(context.timer);
                    }
                    else {
                        col = 0;
                    }
                }
            }
        })(this, 0, 0), dur);
    }
    else {
        for (var row=0; row < this.rows; row++) {
            for (var col=0; col < this.cols; col++) {
                current = this.getObject(row,col);
                if (current) {
                    current.hide(ease, dur);
                }
            }
        }
    }
};

Grid.prototype.moveObject = function(orow, ocol, row, col, clear, ease, dur) {
    var object = this.getObject(orow, ocol);
    if (object) {
        object.setAttribs(this.getPosition(row, col));
        object.row = row;
        object.col = col;
        object.ele.attr({'row': row, 'col': col})
        object.move(ease, dur);
        if (clear) {
            this.removeObject(orow, ocol);
        }
    }
};

Grid.prototype.shuffle = function(ease, dur) {
    var order = [];
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            order.push([row,col])
        }
    }
    shuffleArray(order);
    var new_entries = this.getBlankGrid();
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            var loc = order[row*this.cols+col];
            new_entries[loc[0]][loc[1]] = this.getObject(row, col);
            this.moveObject(row, col, loc[0], loc[1], false, ease, dur);
        }
    }
    this.entries = new_entries;
};

Grid.prototype.unshuffle = function(ease, dur) {
    var new_entries = this.getBlankGrid();
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                new_entries[object.orow][object.ocol] = this.getObject(row, col);
                this.moveObject(row, col, object.orow, object.ocol, false, ease, dur);
            }
        }
    }
    this.entries = new_entries;
};

Grid.prototype.shiftRows = function(ease, dur) {
    var new_entries = this.getBlankGrid();
    for (var row=0; row < this.rows; row++) {
        var new_row = (row+1)%this.rows;
        for (var col=0; col < this.cols; col++) {
            new_entries[new_row][col] = this.getObject(row, col);
            this.moveObject(row, col, new_row, col, false, ease, dur);
        }
    }
    this.entries = new_entries;
};

Grid.prototype.shiftCols = function(ease, dur) {
    var new_entries = this.getBlankGrid();
    for (var col=0; col < this.cols; col++) {
        var new_col = (col+1)%this.cols;
        for (var row=0; row < this.rows; row++) {
            new_entries[row][new_col] = this.getObject(row, col);
            this.moveObject(row, col, row, new_col, false, ease, dur);
        }
    }
    this.entries = new_entries;
};

Grid.prototype.scrollRows = function(ease, dur) {
    for (var row=0; row < this.rows; row++) {
        this.shiftRows(ease, dur);
    }
};

Grid.prototype.scrollCols = function(ease, dur) {
    for (var col=0; col < this.cols; col++) {
        this.shiftCols(ease, dur);
    }
};

Grid.prototype.getPosition = function(row, col) {
    return {'left':   this.offW + (col + this.marg)*this.entryW + col*this.pad,
            'bottom': this.offH + (row + this.marg)*this.entryH + row*this.pad,
            'width':  this.entryW,
            'height': this.entryH
            };
};

Grid.prototype.nextPosition = function() {
    var pos = this.next();
    return this.getPosition(pos.row, pos.col);
};

Grid.prototype.pushToGrid = function(new_grid, row, col, ease, dur) {
    var object = this.getObject(row, col);
    if (object) {
        var next = new_grid.nextPosition(); //This will throw an exception if the grid is full, kills execution
        this.removeObject(row, col);
        object.ele.animate(next, {'easing': ease, 'duration': dur});
        new_grid.pushObject(object);
    }
};

Grid.prototype.pushAllToGrid = function (new_grid, ease, dur) {
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            this.pushToGrid(new_grid, row, col, ease, dur);
        }
    }
};

Grid.prototype.nextLeft = function(row) {
    var col = 0;
    while (col < this.cols) {
        if (!this.getObject(row, col)) {
            return col
        }
        else {
            col += 1
        }
    }
    return -1
};

Grid.prototype.nextRight = function(row) {
    var col = this.cols;
    while (col >= 0) {
        if (!this.getObject(row, col)) {
            return col
        }
        else {
            col -= 1
        }
    }
    return -1
};

Grid.prototype.nextBottom = function(col) {
    var row = 0;
    while (row < this.rows) {
        if (!this.getObject(row, col)) {
            return row
        }
        else {
            row += 1
        }
    }
    return -1
};

Grid.prototype.nextTop = function(col) {
    var row = this.rows-1;
    while (row >= 0) {
        if (!this.getObject(row, col)) {
            return row
        }
        else {
            row -= 1
        }
    }
    return -1
};

Grid.prototype.count = function() {
    var n = 0;
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            if (this.getObject(row, col)) {
                n++;
            }
        }
    }
    return n;
};

Grid.prototype.buildColumns = function(type, ease, dur) {
    var row=0;
    timer = setInterval( (function(context) {
        return function() {
            if (++row == context.rows-1) {
                clearInterval(timer);
            }
            for (var col=0; col < context.cols; col++) {
                var color  = context.getObject(0, col).color;
                context.addObject(new type(color), row, col);
            }
            context.drawObjects(ease, dur);
        }
    })(this), dur);
};

Grid.prototype.fade = function(color, ease, dur) {
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                object.recolor(color, ease, dur);
            }
        }
    }
};

Grid.prototype.remove = function (ease, dur) {
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                object.remove(ease, dur);
            }
        }
    }
    setTimeout( (function(context) {
        return function() {
            context.ele.remove();
            delete this;
        }
    })(this), dur);
};

// TODO: Does this work? This is an old version where the gravity level doesn't even play...
Grid.prototype.gravity = function(ease, dur) {
    for (var col=0; col < this.cols; col++) {
        for (var row=1; row < this.rows; row++) {
            var object = this.getObject(row, col);
            if (object) {
                var next_row = row;
                for (var below=row-1; below >= 0 ; below--) {
                    if (!this.getObject(below, col)) {
                        next_row = below;
                    }
                }
                this.moveObject(row, col, next_row, col, true, ease, dur);
                this.entries[next_row][col] = object;
            }
        }
    }
};

// TODO: Does this work? This is an old version where the gravity level doesn't even play...
Grid.prototype.condense = function(ease, dur) {
    for (var col=0; col < this.cols; col++) {
        for (var row=Math.floor(this.rows/2)+1; row < this.rows; row++) {
            var object = this.getObject(row, col);
            if (object) {
                var next_row = row;
                for (var below=row-1; below >= Math.floor(this.rows/2) ; below--) {
                    if (!this.getObject(below, col)) {
                        next_row = below;
                    }
                }
                this.moveObject(row, col, next_row, col, true, ease, dur);
                this.entries[next_row][col] = object;
            }
        }
    }

    for (var row=0; row < this.rows; row++) {
        for (var col=Math.floor(this.cols/2)+1; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                var next_col = col;
                for (var left=col-1; left >= Math.floor(this.cols/2) ; left--) {
                    if (!this.getObject(row, left)) {
                        next_col = left;
                    }
                }
                this.moveObject(row, col, row, next_col, true, ease, dur);
                this.entries[row][next_col] = object;
            }
        }
    }
    
    for (var col=0; col < this.cols; col++) {
        for (var row=Math.ceil(this.rows/2)-2; row < this.rows; row++) {
            var object = this.getObject(row, col);
            if (object) {
                var next_row = row;
                for (var above=row+1; above < Math.floor(this.rows/2) ; above++) {
                    if (!this.getObject(above, col)) {
                        next_row = above;
                    }
                }
                this.moveObject(row, col, next_row, col, true, ease, dur);
                this.entries[next_row][col] = object;
            }
        }
    }
    
    for (var row=0; row < this.rows; row++) {
        for (var col=Math.ceil(this.cols/2)-2; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                var next_col = col;
                for (var right=col+1; right < Math.floor(this.cols/2) ; right++) {
                    if (!this.getObject(row, right)) {
                        next_col = right;
                    }
                }
                this.moveObject(row, col, row, next_col, true, ease, dur);
                this.entries[row][next_col] = object;
            }
        }
    }
};

Grid.prototype.decolor = function(ease, dur) {
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                object.decolor(ease, dur);
            }
        }
    }
};

Grid.prototype.bind = function(action, fn) {
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                object.bind(action, fn);
            }
        }
    }
};

Grid.prototype.unbind = function(action) {
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                object.unbind(action);
            }
        }
    }
};

Grid.prototype.hide = function(ease, dur) {
    for (var row=0; row < this.rows; row++) {
        for (var col=0; col < this.cols; col++) {
            var object = this.getObject(row, col);
            if (object) {
                object.hide(ease, dur);
            }
        }
    }
};

function Box(color) {
    this.color = color;
    this.ocolor = color;
    this.ele = $(document.createElement('div'));
    this.ele.addClass('box');
    this.ele.css({
        backgroundColor: this.color
    });
}

Box.prototype.draw = function(ease, dur) {
    ease = ease ? ease : 'swing';
    dur  = dur  ? dur  : 500
    if (isNaN(this.left) || isNaN(this.bottom) || isNaN(this.width) || isNaN(this.height)) {
        throw 'Attribute Error: One or more attribute is undefined';
    }
    $('body').append(this.ele);
    this.ele.animate({
        left:   this.left,
        bottom: this.bottom,
        width:  this.width,
        height: this.height
    },{
        duration: dur,
        easing: ease
    });
};

Box.prototype.hide = function(ease, dur) {
    ease = ease ? ease : 'swing';
    dur  = dur  ? dur  : 500
    this.ele.animate({
        width:  0,
        height: 0
    },{
        duration: dur,
        easing: ease
    });
};

Box.prototype.remove = function(ease, dur) {
    ease = ease ? ease : 'swing';
    dur  = dur  ? dur  : 500
    this.hide(ease, dur);
    setTimeout( (function(context) {
        return function() {
            context.ele.remove();
            delete this;
        }
    })(this), dur);
};

Box.prototype.move = function(ease, dur) {
    ease = ease ? ease : 'swing';
    dur  = dur  ? dur  : 500
    if (isNaN(this.left) || isNaN(this.bottom)) {
        throw 'Attribute Error: One or more attribute is undefined';
    }
    this.ele.animate({
        left:   this.left,
        bottom: this.bottom,
    },{
        duration: dur,
        easing: ease
    });
};

Box.prototype.setAttribs = function(dict) {
    for (key in dict) {
        this[key] = dict[key];
    }
};

Box.prototype.recolor = function(color, ease, dur) {
    this.ele.animate({backgroundColor: color}, {duration: dur, easing: ease});
    this.color = color;
};

Box.prototype.decolor = function(ease, dur) {
    this.ele.animate({backgroundColor: this.ocolor}, {duration: dur, easing: ease});
    this.color = this.ocolor;
};

Box.prototype.bind = function(action, fn) {
    this.ele.bind(action, fn);
    // empty line
};

Box.prototype.unbind = function(action) {
    this.ele.unbind(action);
    // empty line
};

function introBuild() {
    var attribs = gridAttribs;
    attribs.rows = 1;
    attribs.cols = colors.length;
    main = new Grid(attribs);
    grids.push(main);
    for (var col=0; col < colors.length; col++) {
        main.addObject(new Box(colors[col]), 0, col);
    }
    main.drawObjects('easeOutQuad', 300, false);
    
    selected = new Grid(selectedAttribs);
    grids.push(selected);

    $('div.box').bind('click', introAdd);
    $('.mainButton').bind('click', introContinue);
}

function introAdd(event) {
    var ele = $(this);
    ele.unbind('click')
    var row = ele.attr('row');
    var col = ele.attr('col');
    main.pushToGrid(selected, row, col, 'easeOutQuad', 300);
    ele.bind('click', introRemove);
}

function introRemove(event) {
    var ele = $(this);
    ele.unbind('click')
    var row = $(this).attr('row');
    var col = $(this).attr('col');
    selected.pushToGrid(main, row, col, 'easeOutQuad', 300);
    ele.bind('click', introAdd);
}

function introContinue() {
    var n = selected.count();
    if (n < 2) {
        main.hideObjects('easeOutQuad', 500);
        main.drawObjects('easeOutQuad', 500);
        selected.hideObjects('easeOutQuad', 500);
        selected.drawObjects('easeOutQuad', 500);
        return null;
    }
    for (var row=0; row < selected.rows; row++) {
        for (var col=0; col < selected.cols; col++) {
            var object = selected.getObject(row, col);
            if (object) {
                chosen.push(object.color);
            }
        }
    }
    $('.mainButton').unbind('click').hide(500);
    main.unbind('click');
    selected.unbind('click');
    main.hideObjects('easeOutQuad', 500);
    main.remove();
    grids.splice(grids.indexOf(main),1);
    var attribs = gridAttribs;
    attribs.rows = n;
    attribs.cols = n;
    grid = new Grid(attribs);
    grids.push(grid);
    selected.pushAllToGrid(grid, 'easeOutQuad', 500);
    selected.remove();
    grids.splice(grids.indexOf(selected),1);
    grid.buildColumns(Box, 'easeOutQuad', 500);
    setTimeout(phases[stage++], grid.rows*500);
}

function memoryBuild() {
    memoryClicked = [];
    memoryMaster = [];
  
    grid.shuffle('easeInOutExpo', 500);
    setTimeout(function() {
        grid.fade(fadeColor, 'easeOutQuad', 500);
        setTimeout(function() {
            grid.bind('click', memoryClick);
        }, 500);
    }, 1500);
}

function memoryClick(event) {
    grid.unbind('click');
    var row = $(this).attr('row');
    var col = $(this).attr('col');
    var box = grid.getObject(row, col);
    
    if ( !objectInArray(box, memoryClicked) && !objectInArray(box, memoryMaster) ) {
        box.decolor('easeOutQuad', 250);
        setTimeout(function() {
            if (memoryClicked.length > 0) {
                if (box.ocolor != memoryClicked[0].ocolor) {
                    for (var i=0; i < memoryClicked.length; i++) {
                        memoryClicked[i].recolor(fadeColor, 'easeOutQuad', 250);
                    }
                    box.recolor(fadeColor, 'easeOutQuad', 250);
                    memoryClicked = [];
                    setTimeout(memoryRebind, 100);
                } else {
                    memoryClicked.push(box);
                    if (memoryClicked.length == grid.cols) {
                        for (var i=0; i < memoryClicked.length; i++) {
                            memoryMaster.push(memoryClicked[i]);
                        }
                        memoryClicked = [];
                    }
                    if (memoryMaster.length == Math.pow(grid.cols,2)) {
                        setTimeout(function() {
                            memoryContinue();
                        }, 250);
                    }
                    else {
                        memoryRebind();
                    }
                }
            } else {
                memoryClicked.push(box);
                memoryRebind();
            }
        }, 250);                    
    } else {
        memoryRebind();
    }    
}

function memoryRebind() {
    for (var row = 0; row < grid.rows; row++) {
        for (var col=0; col < grid.cols; col++) {
            var box = grid.getObject(row, col);
            if ( !objectInArray(box, memoryClicked) && !objectInArray(box, memoryMaster) ) {
                box.ele.bind('click', memoryClick);
            }
        }
    }
}

function memoryContinue() {
    grid.unshuffle('easeOutQuad', 500);
    setTimeout(phases[stage++], 150);
}

function puzzleBuild() {
    var puzzle_pop = grid.getObject(grid.rows-1, grid.cols-1);
    puzzle_row = puzzle_pop.orow;
    puzzle_col = puzzle_pop.ocol;
    puzzle_pop.remove('easeInOutExpo', 500);
    setTimeout(function() {
    
        grid.removeObject(grid.rows-1, grid.cols-1);
        var shuffles = 1;
        for (var i=0; i < shuffles; i++) {
            grid.shuffle('easeInOutExpo', 250);
        }
        while (puzzleCheck()) {
            grid.shuffle('easeInOutExpo', 250);
            shuffles++;
        }
        grid.scrollRows('easeInOutExpo', 200);
        grid.scrollCols('easeInOutExpo', 200);
        setTimeout(function() {
            empty = grid.next();
            grid.bind('click', puzzleClick);
        }, (shuffles+5)*250);
    }, 500);
}

function puzzleCheckRow(row) {
    var col=0;
    var front = grid.getObject(row, col);
    
    while (!front) {
        front = grid.getObject(row, ++col);
    }
    
    var color = front.color;    
    while (++col < grid.cols) {
        var object = grid.getObject(row, col);
        if (object && color != object.color) {
            return false;
        }
    }
    return true;
}

function puzzleCheckCol(col) {
    var row=0;
    var front = grid.getObject(row, col);
    
    while (!front) {
        front = grid.getObject(++row, col);
    }
    
    var color = front.color;    
    while (++row < grid.rows) {
        var object = grid.getObject(row, col);
        if (object && color != object.color) {
            return false;
        }
    }
    return true;
}

function puzzleCheck() {
    check = true;
    for (var row=0; row < grid.rows; row++) {
        if (!puzzleCheckRow(row)) {
            check = false;
            break;
        }
    }
    if (!check) {
        check = true;
        for (var col=0; col < grid.cols; col++) {
            if (!puzzleCheckCol(col)) {
                check = false;
                break;
            }
        }
    }
    return check;
}

function puzzleClick(event) {
    grid.unbind('click');
    
    var row = +$(this).attr('row');
    var col = +$(this).attr('col');
    
    if ( (row == empty.row && Math.abs(col - empty.col) == 1) || (Math.abs(row - empty.row) == 1 && col == empty.col) ) {
        var object = grid.getObject(row, col);      
        grid.moveObject(row, col, empty.row, empty.col, true, 'easeInOutExpo', 200);
        grid.entries[empty.row][empty.col] = object;
        empty = {'row': row, 'col': col};

        setTimeout(function() {
            if (puzzleCheck()) {
                puzzleContinue();
            } else {
                grid.bind('click', puzzleClick);
            }
        }, 250);
    } else {
        grid.bind('click', puzzleClick);
    }
}

function puzzleContinue() {
    var puzzle_push = new Box(chosen[chosen.length-1]);
    puzzle_push.setAttribs({'orow': puzzle_row, 'ocol': puzzle_col});
    
    grid.unshuffle('easeInOutExpo', 500);
    setTimeout(function() {
        grid.pushObject(puzzle_push);
        grid.drawObjects('easeInOutExpo', 500);   
        setTimeout(phases[stage++], 1000);
    }, 500);
}

function lightsBuild() {
    for (var row=0; row < grid.rows; row++) {
        for (var col=0; col < grid.cols; col++) {
            var object = grid.getObject(row, col);
            object.recolor(fadeColor, 'easeOutQuad', 500);
            object.recolor(chosen[0], 'easeOutQuad', 500);
        }
    }
    setTimeout(function() {
        var count = 0
        timer = setInterval(function() {
            var rand_row = Math.floor(Math.random()*grid.rows);
            var rand_col = Math.floor(Math.random()*grid.cols);
            
            lightsChange(rand_row, rand_col, 50);
            
            count++;
            if (count == chosen.length*10) {
                clearInterval(timer);
            }
            
        }, 50);
    }, 1000);

    setTimeout(function() {
        grid.bind('click', lightsClick);
    }, 1000 + chosen.length*500);
}

function lightsClick(event) {
    grid.unbind('click');
    
    lightsChange(+$(this).attr('row'), +$(this).attr('col'), 250)
    
    if (lightsCheck()) {
        lightsContinue();
    } else {
        setTimeout(function() {
            grid.bind('click', lightsClick);
        }, 250);
    }
}

function lightsChange(row, col, dur) {
    var dir = [[-1,0],[1,0],[0,-1],[0,1]];
    
    for (var d=0; d < dir.length; d++) {
        try {
            var object = grid.getObject(row + dir[d][0], col + dir[d][1]);
            var new_color = chosen[(chosen.indexOf(object.color) + 1) % chosen.length];
            object.recolor(new_color, 'easeOutQuad', dur);
        } catch(err) {
            
        }
    }
}

function lightsCheck() {
    var color = grid.getObject(0,0).color; 
    for (var row=0; row < grid.rows; row++) {
        for (var col=0; col < grid.cols; col++) {
            if (color != grid.getObject(row, col).color) {
                return false;
            }
        }
    }
    return true;
}

function lightsContinue() {
    setTimeout(function(){grid.decolor('easeInOutExpo', 500)}, 500);
    setTimeout(phases[stage++], 1500);
}

function reset(event) {
    $('.mainButton').unbind('click');
    $('.resetButton').unbind('click');
    chosen = [];
    for (var i=0; i < grids.length; i++) {
        grids[i].hide('easeInOutExpo', 500);
        setTimeout(function() {
            grids[i].remove();
        }, 500);
    }
    setTimeout(function() {
        stage = 0;
        introBuild();
        $('.mainButton').show(500);
        $('.resetButton').bind('click', reset);
    }, 1500);
}

var colors = ['#4C49A2', '#A31A48', '#CB2402', '#DB4474', '#B8DC3C', '#19DD89', '#34A3D5'];

/*
var randomColor = function(){return '#'+Math.floor(Math.random()*16777215).toString(16);}
var colors = [];
for (var i=0; i < 8; i++) {colors.push(randomColor());}
*/

var fadeColor = '#444444';
var chosen = [];
var grids = [];
var gridAttribs = {
    'height': 80,
    'bottom': 10,
    'width': 80,
    'left': 10
};
var selectedAttribs = {
    'rows': colors.length,
    'cols': 1,
    'height': 50,
    'width': 10
};
var phases  = [memoryBuild, puzzleBuild, lightsBuild, reset];
var stage = 0;

$(document).ready(function() {
    $('.mainButton').animate({'opacity': 0.50}, {'easing': 'easeOutQuad', 'duration': 1200});
    $('.resetButton').animate({'opacity': 0.50}, {'easing': 'easeOutQuad', 'duration': 1200});
    $('.resetButton').bind('click', reset);
    introBuild();
});

}());