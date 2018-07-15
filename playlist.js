class Track {
    constructor (filepath, metadata) {
        let defaultMetaData = {
            track_name: 'Untitled',
            artist: 'Unknown',
            album: 'N/A',
            genre: [],
            track_year: new Date().getFullYear()
        }
        if (metadata !== undefined && metadata.genre !== undefined) {
            if (!metadata.genre instanceof Array) {
                throw 'Genre must be of type Array.'
                return false
            }
        }
        this.filepath = filepath
        this.metadata = Playlist.__extend(true, defaultMetaData, metadata)
    }

    setName (name) {
        this.metadata.track_name = name
    }

    getName () {
        return this.metadata.track_name
    }

    setArtist (artist) {
        this.metadata.artist = artist
    }

    getArtist () {
        return this.metadata.artist
    }

    setAlbum (album) {
        this.metadata.album = album
    }

    getAlbum () {
        return this.metadata.album
    }

    setGenre (genre) {
        if (!genre instanceof Array) {
            throw 'Genre must be of type Array.'
            return
        }
        this.metadata.genre = genre
    }

    addGenre (genre) {
        this.metadata.genre.push(genre)
    }

    removeGenre (genre) {
        if (typeof genre === 'number') {
            if (genre < 0 || genre >= this.metadata.genre.length) {
                throw 'Genre number ' + genre + ' does not exist on this Track.'
                return
            }
            this.metadata.genre.splice(genre, 1)
        } else if (this.metadata.genre.includes(genre)) {
            this.metadata.genre.splice(this.metadata.genre.indexOf(genre), 1)
        } else {
            throw 'Genre does not exist on this Track.'
        }
    }

    getGenre () {
        return this.metadata.genre
    }

    setYear (year) {
        this.metadata.track_year = year
    }

    getYear () {
        return this.metadata.track_year
    }
}

class Playlist {
    constructor (tracks, opts) {
        this.tracks = []
        this.addTrack(tracks)
        this.current_track = 0
        this.looping = false
        this.audio_object = new Audio()
        this.audio_object.setAttribute('controls', true)
        this.audio_object.addEventListener('ended', Playlist.__handleSongEnd.bind(this))
        if (opts !== undefined && opts.volume !== undefined) {
            this.setVolume(opts.volume)
        }
        this.setTrack()
        let defaultOpts = {
            autoPlayNext: true,
            autoPlayDelay: 500,
            trackChanged: function () {
            }
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
                if (this.current_track !== track - 1) {
                    this.opts.trackChanged(this, this.current_track + 1, track)
                }
                this.current_track = track - 1
                this.audio_object.src = this.tracks[this.current_track].filepath
                break
            case 'object':
                if (track instanceof Track) {
                    if (this.tracks.includes(track)) {
                        this.stop()
                        let newTrack = this.tracks.indexOf(track)
                        if (this.current_track !== newTrack) {
                            this.opts.trackChanged(this, this.current_track + 1, newTrack + 1)
                        }
                        this.current_track = newTrack
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
        if (typeof song !== 'undefined') {
            this.setTrack(song)
        }
        var playPromise = this.getAudio().play()
        if (playPromise !== undefined) {
            playPromise.then(function() {
            }).catch(function(e) {
                console.warn(e)
            })
        }
    }

    next () {
        this.stop()
        let old_track = this.current_track
        if (this.current_track == this.tracks.length - 1) {
            this.current_track = 0
        } else {
            this.current_track++
        }
        if (this.current_track !== old_track) {
            this.opts.trackChanged(this, old_track + 1, this.current_track + 1)
        }
        this.audio_object.src = this.tracks[this.current_track].filepath
        this.seek(0)
        this.play()
    }

    prev () {
        this.stop()
        let old_track = this.current_track
        if (this.current_track == 0) {
            this.current_track = this.tracks.length - 1
        } else {
            this.current_track--
        }
        if (this.current_track !== old_track) {
            this.opts.trackChanged(this, old_track + 1, this.current_track + 1)
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
        this.getAudio().volume = volume
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

    static __handleSongEnd () {
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
