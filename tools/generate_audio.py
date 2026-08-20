import asyncio
from pathlib import Path
import edge_tts


VOICE = "en-GB-SoniaNeural"
RATE = "-15%"
VOLUME = "+0%"
PITCH = "+0Hz"

OUTPUT_FILE = Path(
    "assets/audio/grade5/midterm/listening-02.mp3"
)


TEXT = """
Listen and choose the correct answer.

Number two.

In my free time, I like to go for a walk with my friends.
"""


async def generate_audio():

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    communicate = edge_tts.Communicate(
        TEXT,
        VOICE,
        rate=RATE,
        volume=VOLUME,
        pitch=PITCH
    )

    await communicate.save(
        str(OUTPUT_FILE)
    )

    print("Audio created:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    asyncio.run(generate_audio())