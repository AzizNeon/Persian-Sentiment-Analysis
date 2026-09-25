from pathlib import Path

from IPython.display import HTML, display


BASE_DIR = Path(__file__).resolve().parent


def show_block(
    html_file,
    css_file,
):
    html_path = BASE_DIR / html_file
    css_path = BASE_DIR / css_file

    html_content = html_path.read_text(
        encoding="utf-8"
    )

    css_content = css_path.read_text(
        encoding="utf-8"
    )

    display(
        HTML(
            f"""
            <style>
                {css_content}
            </style>

            {html_content}
            """
        )
    )