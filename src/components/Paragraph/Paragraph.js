import React from 'react';
import PropTypes from 'prop-types';

// Styling
import styles from './Paragraph.module.scss';

// Components
import Heading from '../Heading';

const Paragraph = ({ description, heading, image }) => (
    <section className={styles.paragraph}>
        {image &&
            <img
                className={styles[image.position]}
                src={image.url}
                alt=""
            />
        }
        <div className={styles.textContainer}>
            {heading &&
                <div className={styles.headingContainer}>
                    <Heading type="quatenary">
                        {heading}
                    </Heading>
                </div>
            }
            <p>
                {description}
            </p>
        </div>
    </section >
)

Paragraph.propTypes = {
    text: PropTypes.string.isRequired,
    description: PropTypes.string,
    image: PropTypes.exact({
        position: PropTypes.string,
        url: PropTypes.string,
        dataUrl: PropTypes.any
    })
}

export default Paragraph;