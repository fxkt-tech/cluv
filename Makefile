.PHONY: gen
gen:
	cargo run --example composer -- --out-xml cache/song.musicxml --style pop --bpm 300 --length-bars 4 --ppq 480 --time-signature 4/4 --root 60 --lead-program 0 --harmony-program 24 --melody-density 2.0 --velocity-min 70 --velocity-max 110 --seed 42
	cargo run --example composer -- --out-xml cache/song.musicxml --render-wav cache/output.wav --soundfont assets/GeneralUser-GS.sf2 --style jazz --bpm 120 --length-bars 16

.PHONY: play
play:
	ffplay -nodisp cache/output.wav
