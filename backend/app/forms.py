from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, FloatField, SelectField, IntegerField, BooleanField
from wtforms.validators import DataRequired, Length, Optional, NumberRange, Email, EqualTo, ValidationError

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=20)])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class ProductForm(FlaskForm):
    name = StringField('Product Name', validators=[DataRequired(), Length(max=120)])
    description = TextAreaField('Description')
    price = FloatField('Price (Ksh)', validators=[DataRequired(), NumberRange(min=0)])
    category = SelectField('Category', choices=[
        ('Running', 'Running'),
        ('Basketball', 'Basketball'),
        ('Casual', 'Casual'),
        ('Lifestyle', 'Lifestyle'),
        ('Training', 'Training'),
        ('Boots', 'Boots'),
        ('Limited Edition', 'Limited Edition')
    ], validators=[DataRequired()])
    image = FileField('Product Image', validators=[
        FileAllowed(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'], 'Images only!')
    ])
    image_url = StringField('Or Image URL (optional)', validators=[Optional(), Length(max=255)])
    stock = IntegerField('Stock Quantity', validators=[DataRequired(), NumberRange(min=0)], default=10)
    is_featured = BooleanField('Featured Product')
    submit = SubmitField('Save Product')

class CustomerRegisterForm(FlaskForm):
    name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField('Email Address', validators=[DataRequired(), Email(), Length(max=120)])
    phone = StringField('Phone Number', validators=[Optional(), Length(max=20)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(), EqualTo('password', message='Passwords must match')
    ])
    submit = SubmitField('Create Account')

class CustomerLoginForm(FlaskForm):
    email = StringField('Email Address', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Sign In')