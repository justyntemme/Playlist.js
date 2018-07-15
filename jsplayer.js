class JSPlayer {
    constructor (tracks, opts) {
        if (!(tracks instanceof Array) || tracks.length < 1) {
            throw 'JSPlayer must be constructed with an array containing at least one of either HTML5 Audio elements or valid audio file paths as its first parameter.'
            return false
        }

        this.tracks = []
        this.addTrack(tracks)
        this.current_track = 0
        this.looping = false
        this.volume = 1

        let defaultOpts = {
            autoPlayNext: true,
            autoPlayDelay: 500,
        }
        this.opts = this.__extend(true, defaultOpts)
    }

    getTrack () {
        return this.tracks[this.current_track]
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
        var jp = this
        if (typeof song !== undefined) {
            jp.setTrack(song)
        }
        jp.getTrack().volume = jp.volume
        var playPromise = jp.getTrack().play()
        if (playPromise !== undefined) {
            playPromise.then(function() {
            }).catch(function(e) {
                console.warn(e)
            })
        }
    }

    next () {
        this.stop()
        if (this.current_track == this.tracks.length - 1) {
            this.current_track = 0
        } else {
            this.current_track++
        }
        this.seek(0)
        this.play()
    }

    prev () {
        this.stop()
        if (this.current_track == 0) {
            this.current_track = this.tracks.length - 1
        } else {
            this.current_track--
        }
        this.seek(0)
        this.play()
    }

    shuffle () {
        this.tracks = this.__shuffle(this.tracks)
    }

    seek (time) {
        if (typeof time !== 'number') {
            throw 'Time must be a number.'
            return
        }
        if (time < 0) {
            this.seek(0)
        } else if (time > this.getTrack().duration) {
            this.seek(this.getTrack().duration)
        } else {
            this.getTrack().currentTime = time
        }
    }

    pause () {
        this.getTrack().pause()
    }

    stop () {
        this.pause()
        this.seek(0)
    }

    setVolume (volume) {
        if (typeof volume !== 'number' || volume < 0 || volume > 1) {
            throw 'Volume must be a number between 0 and 1.'
            return
        }
        this.volume = volume
        this.getTrack().volume = this.volume
    }

    getTrackLength () {
        return this.getTrack().duration
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
            song.addEventListener('ended', this.__handleSongEnd.bind(this))
            this.tracks.push(song)
        } else if (typeof song === 'string') {
            try {
                var track = new Audio(song)
                track.addEventListener('ended', this.__handleSongEnd.bind(this))
                this.tracks.push(track)
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
        var jp = this
        if (jp.looping) {
            jp.seek(0)
            jp.play()
            return
        }
        if (jp.opts.autoPlayNext) {
            setTimeout(function () {
                jp.next()
            }, jp.opts.autoPlayDelay)
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
