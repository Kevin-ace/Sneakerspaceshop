from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, FloatField, SelectField
from wtforms.validators import DataRequired, Length, URL, NumberRange

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=20)])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class ProductForm(FlaskForm):
    name = StringField('Product Name', validators=[DataRequired(), Length(max=120)])
    description = TextAreaField('Description')
    price = FloatField('Price', validators=[DataRequired(), NumberRange(min=0)])
    category = SelectField('Category', choices=[
        ('Running', 'Running'),
        ('Casual', 'Casual'),
        ('Limited Edition', 'Limited Edition')
    ], validators=[DataRequired()])
    image_url = StringField('Image URL', validators=[DataRequired(), URL()])
    submit = SubmitField('Save Product')