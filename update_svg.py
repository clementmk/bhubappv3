import re

with open('src/components/GymMapSvg.tsx', 'r', encoding='utf-8') as f:
    data = f.read()

new_header = '''import { SvgProps } from "react-native-svg";

interface GymMapProps extends SvgProps {
  activeSector?: string | null;
  onSectorPress?: (sectorId: string) => void;
}

const GymMapSvg = ({ activeSector, onSectorPress, ...props }: GymMapProps) => {
  const getFill = (id: string, defaultColor: string) => 
    activeSector === id ? '#C65A00' : defaultColor;

  return (
'''

if 'interface GymMapProps' not in data:
    data = data.replace('const SvgComponent = (props) => (', new_header)
    data = data.replace('</Svg>\n)', '</Svg>\n  );\n}')
    data = data.replace('export default SvgComponent', 'export default GymMapSvg')

sectors = {
    'm15 376.5': ('I', '#F28C28'),
    'M455 343.5': ('IV', '#F28C28'),
    'm445.5 555': ('VI', '#F28C28'),
    'M322 758.5': ('X', '#F28C28'),
    'm232.5 949.5': ('XI', '#F28C28'),
    'M253 732.5': ('XII', '#F28C28'),
    'm236 504': ('XIII', '#F28C28'),
    'M378.5 435': ('M', '#544F4A'),
    'M314.5 436.5': ('IX', '#F28C28'),
    'M420 965.5': ('VII', '#F28C28'),
    'm499.5 533': ('V', '#F28C28'),
    'm406 179': ('III', '#F28C28'),
    'M45 20': ('II', '#F28C28'),
    'M96 239': ('K', '#544F4A'),
    'm501.5 1091': ('VIII', '#F28C28')
}

for d_start, (sec_id, def_color) in sectors.items():
    pattern = r'<Path([^>]*)fill="' + def_color + r'"([^>]*)d="(' + d_start.replace(' ', r'\s?') + r'[^"]*)"\s*/>'
    
    def replacer(m):
        before = m.group(1)
        after = m.group(2)
        d_val = m.group(3)
        return f'<Path{before}onPress={{() => onSectorPress?.(\'{sec_id}\')}} fill={{getFill(\'{sec_id}\', \'{def_color}\')}}{after}d="{d_val}" />'
        
    data, count = re.subn(pattern, replacer, data)
    print(f"Replaced {sec_id}: {count}")

with open('src/components/GymMapSvg.tsx', 'w', encoding='utf-8') as f:
    f.write(data)
