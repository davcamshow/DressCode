import io
from google.cloud import vision
from google.cloud.vision_v1 import types
import logging

logger = logging.getLogger(__name__)

class ImageAnalyzer:
    def __init__(self):
        try:
            self.client = vision.ImageAnnotatorClient()
            logger.info("Google Cloud Vision client inicializado correctamente")
        except Exception as e:
            logger.error(f"Error al inicializar Google Cloud Vision: {e}")
            self.client = None
        
    def analyze_clothing(self, image_content):
        """Analiza una imagen de prenda y extrae características"""
        if not self.client:
            return self._get_fallback_prediction()
            
        try:
            image = vision.Image(content=image_content)
            
            # Realizar múltiples detecciones
            response = self.client.annotate_image({
                'image': image,
                'features': [
                    {'type_': vision.Feature.Type.LABEL_DETECTION},
                    {'type_': vision.Feature.Type.OBJECT_LOCALIZATION},
                    {'type_': vision.Feature.Type.IMAGE_PROPERTIES},
                    {'type_': vision.Feature.Type.TEXT_DETECTION},
                ]
            })
            
            return self._process_detections(response)
            
        except Exception as e:
            logger.error(f"Error en análisis de imagen: {e}")
            return self._get_fallback_prediction()
    
    def _process_detections(self, response):
        """Procesa las detecciones de Google Vision API"""
        results = {
            'tipo': 'Prenda de vestir',
            'color': 'Multicolor',
            'estilo': 'Casual',
            'temporada': 'Todo el año',
            'colores_dominantes': [],
            'confianza': 0.0,
            'detalles': []
        }
        
        # Análisis de etiquetas (tipo de prenda)
        clothing_labels = self._extract_clothing_labels(response.label_annotations)
        if clothing_labels:
            results['tipo'] = clothing_labels[0]['nombre']
            results['confianza'] = clothing_labels[0]['confianza']
            results['detalles'].extend([f"Etiqueta: {label['nombre']} ({label['confianza']:.2f})" 
                                      for label in clothing_labels[:3]])
        
        # Análisis de objetos
        object_labels = self._extract_object_labels(response.localized_object_annotations)
        if object_labels and object_labels[0]['confianza'] > results['confianza']:
            results['tipo'] = object_labels[0]['nombre']
            results['confianza'] = object_labels[0]['confianza']
            results['detalles'].append(f"Objeto detectado: {object_labels[0]['nombre']}")
        
        # Análisis de colores
        color_info = self._extract_colors(response.image_properties_annotation)
        if color_info:
            results['color'] = color_info['color_principal']
            results['colores_dominantes'] = color_info['colores_dominantes']
            results['detalles'].append(f"Colores: {', '.join(color_info['colores_dominantes'])}")
        
        # Determinar estilo y temporada basado en el tipo y color
        results['estilo'] = self._determinar_estilo(results['tipo'], results['color'])
        results['temporada'] = self._determinar_temporada(results['tipo'], results['color'])
        
        # Análisis de texto (por si hay etiquetas o marcas)
        text_info = self._extract_text(response.text_annotations)
        if text_info:
            results['detalles'].append(f"Texto detectado: {text_info}")
        
        return results
    
    def _extract_clothing_labels(self, labels):
        """Extrae etiquetas relacionadas con ropa"""
        if not labels:
            return []
            
        clothing_terms = {
            'camisa', 'camiseta', 'suéter', 'chaleco', 'chaqueta', 'abrigo', 
            'sudadera', 'chamarra', 'gorra', 'lentes', 'aretes', 'pulsera', 
            'collar', 'guantes', 'pantalones', 'pants', 'shorts', 'mallas', 
            'tenis', 'zapatos', 'chanclas', 'sandalias', 'huaraches', 'vestido',
            'falda', 'blusa', 'traje', 'corbata', 'bufanda', 'sombrero', 'bolso',
            'zapato', 'ropa', 'prenda', 'accesorio', 'joyería', 'bisutería',
            'shirt', 'pants', 'dress', 'shoe', 'hat', 'bag', 'jacket', 'coat',
            'sweater', 'hoodie', 'gloves', 'scarf', 'jewelry', 'accessory'
        }
        
        clothing_labels = []
        for label in labels:
            label_name = label.description.lower()
            if any(term in label_name for term in clothing_terms):
                clothing_labels.append({
                    'nombre': self._translate_clothing_term(label.description),
                    'confianza': label.score
                })
        
        return sorted(clothing_labels, key=lambda x: x['confianza'], reverse=True)[:5]
    
    def _extract_object_labels(self, objects):
        """Extrae objetos detectados relacionados con ropa"""
        if not objects:
            return []
            
        clothing_objects = []
        for obj in objects:
            object_name = obj.name.lower()
            clothing_terms = {'shirt', 'pants', 'dress', 'shoe', 'hat', 'bag', 
                            'jacket', 'person', 'clothing', 'footwear', 'glasses'}
            
            if any(term in object_name for term in clothing_terms):
                clothing_objects.append({
                    'nombre': self._translate_clothing_term(obj.name),
                    'confianza': obj.score
                })
        
        return sorted(clothing_objects, key=lambda x: x['confianza'], reverse=True)[:3]
    
    def _extract_colors(self, color_info):
        """Extrae información de colores de la imagen"""
        if not color_info or not hasattr(color_info, 'dominant_colors'):
            return None
            
        colors = []
        for color in color_info.dominant_colors.colors:
            if color.pixel_fraction > 0.01:  # Solo colores significativos
                color_name = self._rgb_to_color_name(
                    color.color.red, 
                    color.color.green, 
                    color.color.blue
                )
                colors.append({
                    'nombre': color_name,
                    'porcentaje': color.pixel_fraction * 100,
                    'score': color.score
                })
        
        # Ordenar por porcentaje y tomar los principales
        colors.sort(key=lambda x: x['porcentaje'], reverse=True)
        
        if colors:
            return {
                'color_principal': colors[0]['nombre'],
                'colores_dominantes': [c['nombre'] for c in colors[:3] if c['porcentaje'] > 5]
            }
        return None
    
    def _extract_text(self, text_annotations):
        """Extrae texto de la imagen"""
        if not text_annotations:
            return None
            
        # El primer elemento contiene todo el texto
        full_text = text_annotations[0].description
        lines = full_text.split('\n')
        
        # Filtrar líneas que parezcan marcas o etiquetas
        brand_keywords = {'brand', 'marca', 'label', 'etiqueta', 'size', 'talla'}
        relevant_lines = [
            line for line in lines 
            if len(line) > 2 and any(keyword in line.lower() for keyword in brand_keywords)
        ]
        
        return relevant_lines[0] if relevant_lines else None
    
    def _rgb_to_color_name(self, r, g, b):
        """Convierte RGB a nombre de color aproximado"""
        colors = {
            (255, 0, 0): 'Rojo',
            (0, 255, 0): 'Verde',
            (0, 0, 255): 'Azul',
            (255, 255, 0): 'Amarillo',
            (255, 165, 0): 'Naranja',
            (128, 0, 128): 'Morado',
            (255, 192, 203): 'Rosa',
            (0, 0, 0): 'Negro',
            (255, 255, 255): 'Blanco',
            (128, 128, 128): 'Gris',
            (165, 42, 42): 'Marrón',
            (0, 255, 255): 'Celeste',
            (255, 215, 0): 'Dorado',
            (192, 192, 192): 'Plateado',
            (139, 69, 19): 'Café',
            (0, 128, 0): 'Verde oscuro',
            (0, 0, 128): 'Azul marino',
            (128, 0, 0): 'Rojo oscuro'
        }
        
        # Encontrar el color más cercano
        min_distance = float('inf')
        closest_color = 'Multicolor'
        
        for color_rgb, color_name in colors.items():
            distance = sum((c1 - c2) ** 2 for c1, c2 in zip((r, g, b), color_rgb))
            if distance < min_distance:
                min_distance = distance
                closest_color = color_name
        
        return closest_color
    
    def _translate_clothing_term(self, term):
        """Traduce términos de ropa del inglés al español"""
        translations = {
            'shirt': 'Camisa',
            't-shirt': 'Camiseta',
            'pants': 'Pantalones',
            'dress': 'Vestido',
            'shoe': 'Zapato',
            'hat': 'Sombrero',
            'bag': 'Bolso',
            'jacket': 'Chaqueta',
            'coat': 'Abrigo',
            'sweater': 'Suéter',
            'hoodie': 'Sudadera',
            'gloves': 'Guantes',
            'scarf': 'Bufanda',
            'jewelry': 'Joyería',
            'accessory': 'Accesorio',
            'footwear': 'Calzado',
            'glasses': 'Lentes',
            'shorts': 'Shorts',
            'skirt': 'Falda',
            'blouse': 'Blusa',
            'suit': 'Traje',
            'tie': 'Corbata',
            'sneakers': 'Tenis',
            'sandals': 'Sandalias',
            'boots': 'Botas'
        }
        
        term_lower = term.lower()
        for eng, esp in translations.items():
            if eng in term_lower:
                return esp
                
        return term  # Devolver original si no hay traducción
    
    def _determinar_estilo(self, tipo, color):
        """Determina el estilo basado en el tipo y color"""
        estilo_map = {
            'camisa': 'Formal' if color in ['Blanco', 'Azul', 'Negro', 'Azul marino'] else 'Casual',
            'traje': 'Formal',
            'corbata': 'Formal',
            'pantalones': 'Formal' if color in ['Negro', 'Gris', 'Azul marino', 'Beige'] else 'Casual',
            'vestido': 'Formal' if color in ['Negro', 'Rojo', 'Azul marino'] else 'Casual',
            'zapato': 'Formal' if color in ['Negro', 'Marrón', 'Café'] else 'Casual',
            'tenis': 'Deportivo',
            'sudadera': 'Deportivo',
            'shorts': 'Casual',
            'gorra': 'Casual',
            'camiseta': 'Casual',
            'suéter': 'Casual',
            'chaqueta': 'Casual' if color in ['Azul', 'Negro'] else 'Informal',
            'abrigo': 'Formal',
        }
        
        for key, value in estilo_map.items():
            if key in tipo.lower():
                return value
        
        return 'Casual'
    
    def _determinar_temporada(self, tipo, color):
        """Determina la temporada basada en el tipo y color"""
        temporada_map = {
            'abrigo': 'Invierno',
            'suéter': 'Invierno',
            'chaleco': 'Otoño/Invierno',
            'guantes': 'Invierno',
            'bufanda': 'Invierno',
            'shorts': 'Verano',
            'sandalias': 'Verano',
            'chanclas': 'Verano',
            'camiseta': 'Verano',
            'gorra': 'Verano',
            'tenis': 'Todo el año',
            'pantalones': 'Todo el año',
            'camisa': 'Primavera/Verano' if color in ['Blanco', 'Amarillo', 'Celeste'] else 'Todo el año',
        }
        
        for key, value in temporada_map.items():
            if key in tipo.lower():
                return value
        
        # Basado en colores
        colores_verano = ['Blanco', 'Amarillo', 'Rosa', 'Celeste', 'Naranja']
        colores_invierno = ['Negro', 'Gris', 'Azul marino', 'Marrón', 'Café']
        colores_primavera = ['Verde', 'Rosa', 'Amarillo', 'Morado']
        
        if color in colores_verano:
            return 'Verano'
        elif color in colores_invierno:
            return 'Invierno'
        elif color in colores_primavera:
            return 'Primavera'
        
        return 'Todo el año'
    
    def _get_fallback_prediction(self):
        """Predicción por defecto en caso de error"""
        return {
            'tipo': 'Prenda de vestir',
            'color': 'Multicolor',
            'estilo': 'Casual',
            'temporada': 'Todo el año',
            'colores_dominantes': ['Multicolor'],
            'confianza': 0.0,
            'detalles': ['Análisis básico - Verifique la imagen']
        }