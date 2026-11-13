"""Mode space_weather: giu thiet bi lay mau lien tuc o quy dao buc xa cao. SEU/reset ngat tich luy live-time."""


class SpaceWeather:
    id = "space_weather"

    def arm(self, ctx):
        return {"live_s": 0.0, "elapsed_s": 0.0, "resets": 0, "science_pts": ctx["science_pts"]}

    def on_action(self, st, action, env):
        return st, []

    def tick(self, st, dt, env):
        live = st["live_s"] + (dt if (env["power_ok"] and not env["in_reset"]) else 0.0)
        return {**st, "live_s": live, "elapsed_s": st["elapsed_s"] + dt}, []

    def score(self, st):
        f = st["live_s"] / st["elapsed_s"] if st["elapsed_s"] > 0 else 0.0
        return {"science_delivered_pts": st["science_pts"] * f, "detail": {"live_fraction": round(f, 4)}}

    def hud(self, st, t):
        f = st["live_s"] / st["elapsed_s"] if st["elapsed_s"] > 0 else 0.0
        return {"title": "SPACE WEATHER", "lines": [f"Live-time {f:.1%}"], "prompts": [], "windows": []}

    def view_hint(self, st, t):
        return {"camera": "orbit"}
