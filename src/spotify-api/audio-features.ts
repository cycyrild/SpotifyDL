interface AudioFeatures {
    acousticness: number; // A confidence measure from 0.0 to 1.0 of whether the track is acoustic.
    analysis_url: string; // A URL to access the full audio analysis of this track.
    danceability: number; // Describes how suitable a track is for dancing from 0.0 to 1.0.
    duration_ms: number; // The duration of the track in milliseconds.
    energy: number; // A perceptual measure of intensity and activity from 0.0 to 1.0.
    id: string; // The Spotify ID for the track.
    instrumentalness: number; // Predicts whether a track contains no vocals from 0.0 to 1.0.
    key: number; // The key the track is in, with values ranging from -1 to 11.
    liveness: number; // Detects the presence of an audience in the recording from 0.0 to 1.0.
    loudness: number; // The overall loudness of a track in decibels (dB).
    mode: number; // Indicates the modality of the track, with 1 for major and 0 for minor.
    speechiness: number; // Detects the presence of spoken words in a track from 0.0 to 1.0.
    tempo: number; // The overall estimated tempo of a track in beats per minute (BPM).
    time_signature: number; // The estimated time signature of the track.
    track_href: string; // A link to the Web API endpoint providing full details of the track.
    type: string; // The object type, typically "audio_features".
    uri: string; // The Spotify URI for the track.
    valence: number; // Describes the musical positiveness conveyed by a track from 0.0 to 1.0.
  }