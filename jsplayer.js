class JSPlayer {
    constructor (tracks, opts) {
        if (!(tracks instanceof Array) || tracks.length < 1) {
            throw 'JSPlayer must be constructed with an array containing at least one of either HTML5 Audio elements or valid audio file paths as its first parameter.'
            return false
        }

        this.tracks = []
        for (var i = 0; i < tracks.length; i++) {
            if (tracks[i] instanceof Audio) {
                this.tracks.push(tracks[i])
                continue
            } else if (typeof tracks[i] === 'string') {
                try {
                    this.tracks.push(new Audio(tracks[i]))
                } catch (e) {
                    throw 'JSPlayer must be constructed with an array containing at least one of either HTML5 Audio elements or valid audio file paths as its first parameter.'
                }
            }
        }
        this.current_track = 0
        this.looping = false

        let defaultOpts = {
            autoPlayNext: true
        }
        this.opts = this.__extend(true, defaultOpts)
    }

    getTrack () {
        return this.tracks[current_track]
    }

    setTrack (song) {
        switch (typeof song) {
            case 'number':
                if (song > this.tracks.length) {
                    throw 'Cannot set track number ' + song + '; there are only ' + this.tracks.length + ' tracks.'
                    return false
                }
                this.stop()
                this.current_track = song - 1
                break
            case 'object':
                if (song instanceof Audio) {
                    if (this.tracks.includes(song)) {
                        this.stop()
                        this.current_track = this.tracks.indexOf(song)
                    } else {
                        throw 'Cannot set track to this Audio element. It must be added to the track list first.'
                        return false
                    }
                } else {
                    throw 'Invalid parameter passed to JSPlayer.setTrack().'
                    return false
                }
                break
            case 'undefined':
                break
            default:
                throw 'Invalid parameter passed to JSPlayer.setTrack().'
                break
        }
    }

    play (song) {
        if (typeof song !== undefined) {
            this.setTrack(song)
        }
        this.getTrack().play()
        this.getTrack().addEventListener('ended', this.__handleSongEnd)
    }

    next () {
        if (this.current_track == this.tracks.length - 1) {
            this.setTrack(0)
        } else {
            this.setTrack(this.current_track + 1)
        }
    }

    prev () {
        if (this.current_track == 0) {
            this.setTrack(this.tracks.length - 1)
        } else {
            this.setTrack(this.current_track - 1)
        }
    }

    shuffle () {
        this.tracks = this.__shuffle(this.tracks)
    }

    seek (time) {
        this.getTrack().currentTime = time
    }

    pause () {
        this.getTrack().pause()
    }

    stop () {
        this.pause()
        this.seek(0)
        this.getTrack().removeEventListener('ended', this.__handleSongEnd)
    }

    setVolume (volume) {
        if (typeof volume !== 'number' || volume < 0 || volume > 1) {
            throw 'Volume must be a number between 0 and 1.'
            return
        }
        this.getTrack().volume = volume
    }

    getVolume () {
        return this.getTrack().volume
    }

    mute () {
        this.setVolume(0)
    }

    setLoop (onOff) {
        this.looping = !!onOff
    }

    addTrack (song) {
        if (song instanceof Array) {
            for (var i = 0; i < song.length; i++) {
                this.addTrack(song[i])
            }
            return
        }
        if (song instanceof Audio) {
            this.tracks.push(song)
        } else if (typeof song === 'string') {
            try {
                this.tracks.push(new Audio(song))
            } catch (e) {
                throw 'Invalid parameter passed to JSPlayer.addTrack().'
            }
        } else {
            throw 'Invalid parameter passed to JSPlayer.addTrack().'
        }
    }

    removeTrack (song) {
        if (song instanceof Array) {
            for (var i = 0; i < song.length; i++) {
                this.removeTrack(song[i])
            }
            return
        }
        if (song instanceof Audio) {
            if (this.tracks.includes(song)) {
                this.tracks.splice(this.tracks.indexOf(song), 1)
            } else {
                throw 'One cannot remove a track that one has never added.'
                return
            }
        } else if (typeof song === 'number') {
            if (song > this.tracks.length) {
                throw 'There aren\'t even ' + song + ' tracks on this track list.'
                return
            }
            this.tracks.splice(song - 1, 1)
        } else {
            throw 'Invalid parameter passed to JSPlayer.removeTrack().'
        }
    }

    __handleSongEnd () {
        if (this.looping) {
            this.stop()
            this.play()
            return
        }
        if (this.opts.autoPlayNext) {
            this.stop()
            this.next()
            this.seek(0)
            this.play()
        }
    }

    // source: https://gomakethings.com/vanilla-javascript-version-of-jquery-extend/
    // mimics jQuery's $.extend
    __extend () {
        var crm = this
        var extended = {}
        var deep = false
        var i = 0
        var length = arguments.length

        // Check if a deep merge
        if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
            deep = arguments[0]
            i++
        }

        // Merge the object into the extended object
        var merge = function (obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    // If deep merge and property is an object, merge properties
                    if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                        extended[prop] = crm.__extend(true, extended[prop], obj[prop])
                    } else {
                        extended[prop] = obj[prop]
                    }
                }
            }
        }

        // Loop through each object and conduct a merge
        for (; i < length; i++) {
            var obj = arguments[i]
            merge(obj)
        }

        return extended
    }

    // source: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    // shuffles an array
    __shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
}
