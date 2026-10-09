import os
from PIL import Image, ImageDraw, ImageFont

def generate():
    SIZE = 2048
    GREEN = (57, 255, 20, 255)       # #39ff14
    INK = (17, 24, 39, 255)          # #111827
    WHITE = (255, 255, 255, 255)
    TRANSPARENT = (0, 0, 0, 0)

    font_path = 'C:/Windows/Fonts/segoeuib.ttf'
    if not os.path.exists(font_path):
        font_path = 'C:/Windows/Fonts/arialbd.ttf'
    font = ImageFont.truetype(font_path, 116)

    text1 = 'cloudynation'
    text2 = 'pos'

    bbox1 = font.getbbox(text1)
    bbox2 = font.getbbox(text2)
    w1 = bbox1[2] - bbox1[0]
    w2 = bbox2[2] - bbox2[0]
    total_text_w = w1 + w2

    # Pills dimensions
    pill_w = 176
    pill_h = 560
    pill_radius = pill_w // 2
    pill_gap = 64
    total_pills_w = pill_w * 2 + pill_gap

    gap_pills_text = 88
    text_h = bbox1[3] - bbox1[1]
    total_content_h = pill_h + gap_pills_text + text_h

    start_y = (SIZE - total_content_h) // 2 - 20

    pills_start_x = (SIZE - total_pills_w) // 2
    p1_x0 = pills_start_x
    p1_y0 = start_y
    p1_x1 = p1_x0 + pill_w
    p1_y1 = p1_y0 + pill_h

    p2_x0 = p1_x1 + pill_gap
    p2_y0 = start_y
    p2_x1 = p2_x0 + pill_w
    p2_y1 = p2_y0 + pill_h

    text_start_x = (SIZE - total_text_w) // 2
    text_y = p1_y1 + gap_pills_text

    # Master Full Icon (White background)
    master_full = Image.new('RGBA', (SIZE, SIZE), WHITE)
    d_full = ImageDraw.Draw(master_full)
    d_full.rounded_rectangle([p1_x0, p1_y0, p1_x1, p1_y1], radius=pill_radius, fill=GREEN)
    d_full.rounded_rectangle([p2_x0, p2_y0, p2_x1, p2_y1], radius=pill_radius, fill=INK)
    d_full.text((text_start_x, text_y), text1, font=font, fill=INK)
    d_full.text((text_start_x + w1, text_y), text2, font=font, fill=GREEN)

    # Master Adaptive Foreground (Transparent background)
    master_fg = Image.new('RGBA', (SIZE, SIZE), TRANSPARENT)
    d_fg = ImageDraw.Draw(master_fg)
    d_fg.rounded_rectangle([p1_x0, p1_y0, p1_x1, p1_y1], radius=pill_radius, fill=GREEN)
    d_fg.rounded_rectangle([p2_x0, p2_y0, p2_x1, p2_y1], radius=pill_radius, fill=INK)
    d_fg.text((text_start_x, text_y), text1, font=font, fill=INK)
    d_fg.text((text_start_x + w1, text_y), text2, font=font, fill=GREEN)

    # Master Adaptive Monochrome (White on transparent)
    master_mono = Image.new('RGBA', (SIZE, SIZE), TRANSPARENT)
    d_mono = ImageDraw.Draw(master_mono)
    d_mono.rounded_rectangle([p1_x0, p1_y0, p1_x1, p1_y1], radius=pill_radius, fill=(255, 255, 255, 200))
    d_mono.rounded_rectangle([p2_x0, p2_y0, p2_x1, p2_y1], radius=pill_radius, fill=(255, 255, 255, 255))
    d_mono.text((text_start_x, text_y), text1, font=font, fill=(255, 255, 255, 255))
    d_mono.text((text_start_x + w1, text_y), text2, font=font, fill=(255, 255, 255, 255))

    # Helper function to create circular masked image
    def make_round(img, sz):
        resized = img.resize((sz, sz), Image.Resampling.LANCZOS)
        # Super-sampled mask for smooth anti-aliased circle
        mask_large = Image.new('L', (sz * 4, sz * 4), 0)
        draw_m = ImageDraw.Draw(mask_large)
        draw_m.ellipse((0, 0, sz * 4, sz * 4), fill=255)
        mask = mask_large.resize((sz, sz), Image.Resampling.LANCZOS)
        
        round_img = Image.new('RGBA', (sz, sz), (0, 0, 0, 0))
        round_img.paste(resized, (0, 0), mask)
        return round_img

    # 1. Update assets/
    assets_dir = 'assets'
    os.makedirs(assets_dir, exist_ok=True)
    
    print("Saving assets/icon.png...")
    master_full.resize((1024, 1024), Image.Resampling.LANCZOS).save(os.path.join(assets_dir, 'icon.png'))
    master_full.resize((1024, 1024), Image.Resampling.LANCZOS).save(os.path.join(assets_dir, 'splash-icon.png'))
    
    print("Saving assets/android-icon-foreground.png...")
    master_fg.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(assets_dir, 'android-icon-foreground.png'))
    
    print("Saving assets/android-icon-background.png...")
    Image.new('RGBA', (512, 512), WHITE).save(os.path.join(assets_dir, 'android-icon-background.png'))
    
    print("Saving assets/android-icon-monochrome.png...")
    master_mono.resize((432, 432), Image.Resampling.LANCZOS).save(os.path.join(assets_dir, 'android-icon-monochrome.png'))
    
    print("Saving assets/favicon.png...")
    master_full.resize((48, 48), Image.Resampling.LANCZOS).save(os.path.join(assets_dir, 'favicon.png'))

    # 2. Update Android mipmap directories
    densities = {
        'mipmap-mdpi':    {'icon': 48,  'adaptive': 108},
        'mipmap-hdpi':    {'icon': 72,  'adaptive': 162},
        'mipmap-xhdpi':   {'icon': 96,  'adaptive': 216},
        'mipmap-xxhdpi':  {'icon': 144, 'adaptive': 324},
        'mipmap-xxxhdpi': {'icon': 192, 'adaptive': 432},
    }

    base_res = 'android/app/src/main/res'
    for folder, sizes in densities.items():
        dir_path = os.path.join(base_res, folder)
        if not os.path.exists(dir_path):
            continue
        
        icon_sz = sizes['icon']
        adap_sz = sizes['adaptive']

        print(f"Updating {folder} (icon: {icon_sz}x{icon_sz}, adaptive: {adap_sz}x{adap_sz})...")

        # ic_launcher.webp
        master_full.resize((icon_sz, icon_sz), Image.Resampling.LANCZOS).save(
            os.path.join(dir_path, 'ic_launcher.webp'), 'WEBP', quality=95
        )

        # ic_launcher_round.webp
        make_round(master_full, icon_sz).save(
            os.path.join(dir_path, 'ic_launcher_round.webp'), 'WEBP', quality=95
        )

        # ic_launcher_foreground.webp
        master_fg.resize((adap_sz, adap_sz), Image.Resampling.LANCZOS).save(
            os.path.join(dir_path, 'ic_launcher_foreground.webp'), 'WEBP', quality=95
        )

        # ic_launcher_background.webp (White)
        Image.new('RGBA', (adap_sz, adap_sz), WHITE).save(
            os.path.join(dir_path, 'ic_launcher_background.webp'), 'WEBP', quality=95
        )

        # ic_launcher_monochrome.webp
        master_mono.resize((adap_sz, adap_sz), Image.Resampling.LANCZOS).save(
            os.path.join(dir_path, 'ic_launcher_monochrome.webp'), 'WEBP', quality=95
        )

    print("ALL ICONS SUCCESSFULLY GENERATED AND REPLACED!")

if __name__ == '__main__':
    generate()
