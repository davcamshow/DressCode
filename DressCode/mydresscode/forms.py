from django import forms


TALLA_CHOICES = [
    ('XXS', 'XXS'), ('XS', 'XS'), ('S', 'S'), ('M', 'M'),
    ('L', 'L'), ('XL', 'XL'), ('XXL', 'XXL'),
]


CALZADO_CHOICES = [
    (22, '22'), (22.5, '22.5'),(23, '23'),(23.5, '23.5'),
    (24, '24'),(24.5, '24.5'),(25, '25'),(25.5, '25.5'),
    (26, '26'),(26.5, '26.5'),(27, '27'),(27.5, '27.5'),
    (28, '28'),(28.5, '28.5'),(29, '29'),(29.5, '29.5'),(30, '30'),
]

ESTILO_CHOICES = [
    ('CASUAL', 'Casual'), ('FORMAL', 'Formal'), ('DEPORTIVO', 'Deportivo'),
    ('ELEGANTE', 'Elegante'), ('BOHEMIO', 'Bohemio'), ('STREETWEAR', 'Streetwear'),
    ('MINIMALISTA', 'Minimalista'), ('VINTAGE', 'Vintage'),
]

COLOR_CHOICES = [
    ('NEGRO', 'Negro'), ('BLANCO', 'Blanco'), ('GRIS', 'Gris'), ('BEIGE', 'Beige'),
    ('AZUL', 'Azul'), ('VERDE', 'Verde'), ('ROJO', 'Rojo'), ('ROSA', 'Rosa'),
    ('MORADO', 'Morado'), ('AMARILLO', 'Amarillo'), ('NARANJA', 'Naranja'),
    ('MARRON', 'Marrón'),
]

ESTACION_CHOICES = [
    ('PRIMAVERA', 'Primavera'), ('VERANO', 'Verano'), ('OTONO', 'Otoño'), ('INVIERNO', 'Invierno'),
]

class EstiloForm(forms.Form):
    estilos = forms.MultipleChoiceField(
        label='¿Cuál es tu estilo?',
        choices=ESTILO_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False 
    )


class ColorForm(forms.Form):
    colores_fav = forms.MultipleChoiceField(
        label='¿Qué colores te encantan?',
        choices=COLOR_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )


class EstacionForm(forms.Form):
    temporadas_fav = forms.MultipleChoiceField(
        label='¿Cuáles son tus temporadas favoritas?',
        choices=ESTACION_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

class TallaForm(forms.Form):
    talla_superior = forms.ChoiceField(
        label='Talla Superior (Camisas, Chaquetas)',
        choices=TALLA_CHOICES,
        widget=forms.RadioSelect, 
        required=True 
    )
    talla_inferior = forms.ChoiceField(
        label='Talla Inferior (Pantalones, Faldas)',
        choices=TALLA_CHOICES,
        widget=forms.RadioSelect, 
        required=True
    )
    talla_calzado = forms.ChoiceField(
        label='Talla de Calzado',
        choices=CALZADO_CHOICES,
        widget=forms.RadioSelect, 
        required=True
    )