class Track {
    constructor (filepath, metadata) {
        this.filepath = filepath
        let defaultMetaData = {
            track_name: 'Untitled',
            artist: 'Unknown',
            album: 'N/A',
            genre: [],
            track_year: new Date().getFullYear()
        }
        this.metadata = Playlist.__extend(true, defaultMetaData, metadata)
    }
}

class Playlist {
    constructor (tracks, opts) {
        this.tracks = []
        this.addTrack(tracks)
        this.current_track = 0
        this.looping = false
        this.audio_object = new Audio()
        this.audio_object.addEventListener('ended', this.__handleSongEnd.bind(this))
        this.setTrack()
        let defaultOpts = {
            autoPlayNext: true,
            autoPlayDelay: 500,
            volume: 1
        }
        this.opts = Playlist.__extend(true, defaultOpts, opts)
    }

    getTrack () {
        return this.tracks[this.current_track]
    }

    getAudio () {
        return this.audio_object
    }

    setTrack (track) {
        switch (typeof track) {
            case 'number':
                if (track < 1 || track > this.tracks.length) {
                    throw 'Track number ' + track + ' does not exist on this Playlist.'
                    return false
                }
                this.stop()
                this.current_track = track - 1
                this.audio_object.src = this.tracks[this.current_track].filepath
                break
            case 'object':
                if (track instanceof Track) {
                    if (this.tracks.includes(track)) {
                        this.stop()
                        this.current_track = this.tracks.indexOf(track)
                        this.audio_object.src = this.tracks[this.current_track].filepath
                    } else {
                        throw 'Track "' + track.metadata.track_name + '" does not exist on this Playlist.'
                        return false
                    }
                } else {
                    throw 'Invalid parameter passed to Playlist.setTrack().'
                    return false
                }
                break
            case 'undefined':
                this.audio_object.src = this.tracks[this.current_track].filepath
                break
            default:
                throw 'Invalid parameter passed to Playlist.setTrack().'
                break
        }
    }

    play (song) {
        var jp = this
        if (typeof song !== undefined) {
            jp.setTrack(song)
        }
        jp.getAudio().volume = jp.opts.volume
        var playPromise = jp.getAudio().play()
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
        this.audio_object.src = this.tracks[this.current_track].filepath
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
        this.audio_object.src = this.tracks[this.current_track].filepath
        this.seek(0)
        this.play()
    }

    shuffle () {
        this.stop()
        this.tracks = this.__shuffle(this.tracks)
    }

    seek (time) {
        if (typeof time !== 'number') {
            throw 'Time must be a number.'
            return
        }
        if (time < 0) {
            this.seek(0)
        } else if (time > this.getAudio().duration) {
            this.seek(this.getAudio().duration)
        } else {
            this.getAudio().currentTime = time
        }
    }

    pause () {
        this.getAudio().pause()
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
        this.opts.volume = volume
        this.getAudio().volume = this.opts.volume
    }

    getTrackLength () {
        return this.getAudio().duration
    }

    getVolume () {
        return this.getAudio().volume
    }

    mute () {
        this.setVolume(0)
    }

    setAutoPlayDelay (delay) {
        this.opts.autoPlayDelay = delay
    }

    getAutoPlayDelay () {
        return this.opts.autoPlayDelay
    }

    setAutoPlayNext (autoPlayNext) {
        this.opts.autoPlayNext = !!autoPlayNext
    }

    getAutoPlayNext () {
        return this.opts.autoPlayNext
    }

    setLoop (onOff) {
        this.looping = !!onOff
    }

    addTrack (track) {
        if (track instanceof Array) {
            for (var i = 0; i < track.length; i++) {
                this.addTrack(track[i])
            }
            return
        } else if (typeof track === 'string') {
            this.tracks.push(new Track(track))
        } else if (track instanceof Track) {
            this.tracks.push(track)
        } else {
            throw 'Invalid parameter passed to Playlist.addTrack(). Must be string or Track.'
        }
    }

    removeTrack (track) {
        this.stop()
        if (track instanceof Array) {
            for (var i = 0; i < track.length; i++) {
                this.removeTrack(track[i])
            }
            return
        }
        if (track instanceof Track) {
            if (this.tracks.includes(track)) {
                if (this.tracks.length == 1) {
                    throw 'Playlists must contain at least one Track.'
                    return
                }
                this.tracks.splice(this.tracks.indexOf(track), 1)
            } else {
                throw 'Track "' + track.metadata.track_name + '" does not exist on this Playlist.'
                return
            }
        } else if (typeof track === 'number') {
            if (track < 0 || track > this.tracks.length) {
                throw 'Track number ' + track + ' does not exist on this Playlist.'
                return
            }
            if (this.tracks.length == 1) {
                throw 'Playlists must contain at least one Track.'
                return
            }
            this.tracks.splice(track - 1, 1)
        } else {
            throw 'Invalid parameter passed to Playlist.removeTrack(). Must be number or Track.'
        }
        if (this.current_track > this.tracks.length) {
            this.setTrack(this.tracks.length - 1)
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
    static __extend () {
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
    static __shuffle(a) {
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
