from django import forms


TALLA_CHOICES = [
    ('XXS', 'XXS'), ('XS', 'XS'), ('S', 'S'), ('M', 'M'),
    ('L', 'L'), ('XL', 'XL'), ('XXL', 'XXL'),
]


CALZADO_CHOICES = [
    (35, '35'), (36, '36'), (37, '37'), (38, '38'), (39, '39'), 
    (40, '40'), (41, '41'), (42, '42'), (43, '43'), (44, '44'),
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